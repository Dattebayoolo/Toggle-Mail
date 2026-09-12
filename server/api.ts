// ============================================================
// Toggle Mail – Core REST API Handler (v0.2 Enterprise)
// ============================================================

import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { db, type EmailRecord } from './db';
import { smtp } from './smtp';
import { extractSSOUser } from './sso';
import { buildThreads } from './threads';
import { parseSearchQuery, evaluateSearch } from './search';
import { events } from './events';

const ATTACHMENTS_DIR = path.resolve(process.cwd(), 'data', 'attachments');

function sendJson(res: ServerResponse, status: number, data: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 25 * 1024 * 1024) {
        // 25MB limit
        req.destroy();
        reject(new Error('Body payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function parseBufferBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost:3000'}`);
  const pathname = url.pathname;
  const method = req.method?.toUpperCase() || 'GET';

  if (!pathname.startsWith('/api/')) {
    return false;
  }

  const user = extractSSOUser(req.headers);

  try {
    // ─── GET /api/events (Server-Sent Events) ───────────────────
    if (pathname === '/api/events' && method === 'GET') {
      events.addClient(res);
      return true;
    }

    // ─── GET /api/user ──────────────────────────────────────────
    if (pathname === '/api/user' && method === 'GET') {
      sendJson(res, 200, { user });
      return true;
    }

    // ─── GET /api/storage ───────────────────────────────────────
    if (pathname === '/api/storage' && method === 'GET') {
      const stats = db.getStorageStats();
      sendJson(res, 200, stats);
      return true;
    }

    // ─── GET /api/threads ───────────────────────────────────────
    if (pathname === '/api/threads' && method === 'GET') {
      const folder = url.searchParams.get('folder') || undefined;
      const category = url.searchParams.get('category') || undefined;
      const label = url.searchParams.get('label') || undefined;
      const search = url.searchParams.get('search') || undefined;

      let rawEmails = db.getAll();

      // Apply search operator filter if present
      if (search) {
        const filter = parseSearchQuery(search);
        rawEmails = evaluateSearch(rawEmails, filter);
      }

      let threads = buildThreads(rawEmails);

      if (folder) {
        if (folder === 'allMail') {
          threads = threads.filter(t => t.folder !== 'trash' && t.folder !== 'spam');
        } else if (folder === 'starred') {
          threads = threads.filter(t => t.isStarred);
        } else if (folder === 'important') {
          threads = threads.filter(t => t.isImportant);
        } else {
          threads = threads.filter(t => t.folder === folder);
        }
      }

      if (category && (!folder || folder === 'inbox')) {
        threads = threads.filter(t => t.category === category);
      }

      if (label) {
        threads = threads.filter(t => t.labels.includes(label));
      }

      sendJson(res, 200, { threads, total: threads.length });
      return true;
    }

    // ─── GET /api/threads/:id ───────────────────────────────────
    const threadMatch = pathname.match(/^\/api\/threads\/([^/]+)$/);
    if (threadMatch && method === 'GET') {
      const threadId = decodeURIComponent(threadMatch[1]);
      const threads = buildThreads(db.getAll());
      const thread = threads.find(t => t.id === threadId);
      if (!thread) {
        sendJson(res, 404, { error: 'Thread not found' });
        return true;
      }
      sendJson(res, 200, { thread });
      return true;
    }

    // ─── GET /api/emails ────────────────────────────────────────
    if (pathname === '/api/emails' && method === 'GET') {
      const folder = url.searchParams.get('folder') || undefined;
      const category = url.searchParams.get('category') || undefined;
      const label = url.searchParams.get('label') || undefined;
      const search = url.searchParams.get('search') || undefined;

      let emails = db.getAll({ folder, category, label });

      if (search) {
        const filter = parseSearchQuery(search);
        emails = evaluateSearch(emails, filter);
      }

      sendJson(res, 200, { emails, total: emails.length });
      return true;
    }

    // ─── GET /api/emails/:id ────────────────────────────────────
    const emailMatch = pathname.match(/^\/api\/emails\/([a-zA-Z0-9_-]+)$/);
    if (emailMatch && method === 'GET') {
      const email = db.getById(emailMatch[1]);
      if (!email) {
        sendJson(res, 404, { error: 'Email not found' });
        return true;
      }
      sendJson(res, 200, { email });
      return true;
    }

    // ─── POST /api/emails/send ──────────────────────────────────
    if (pathname === '/api/emails/send' && method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.to) {
        sendJson(res, 400, { error: 'Recipient "to" field is required.' });
        return true;
      }

      const result = await smtp.sendMail(
        {
          to: body.to,
          cc: body.cc,
          bcc: body.bcc,
          subject: body.subject || '',
          body: body.body || '',
          attachments: body.attachments,
        },
        user
      );

      // Broadcast new email event via SSE
      events.notifyNewEmail(result.record);
      events.notifyStorageUpdate(db.getStorageStats());

      sendJson(res, 201, result);
      return true;
    }

    // ─── POST /api/emails/draft ─────────────────────────────────
    if (pathname === '/api/emails/draft' && method === 'POST') {
      const body = await parseJsonBody(req);
      const now = new Date().toISOString();
      const draftId = body.id || `draft-${Date.now()}`;

      const existing = db.getById(draftId);
      const draftRecord: EmailRecord = {
        id: draftId,
        from: `${user.displayName} <${user.email}>`,
        fromName: user.displayName,
        fromAvatar: user.avatarText,
        fromEmail: user.email,
        to: body.to || '',
        cc: body.cc,
        bcc: body.bcc,
        subject: body.subject || '(draft)',
        snippet: body.body ? body.body.replace(/<[^>]*>/g, '').slice(0, 100) : '',
        body: body.body || '',
        date: now,
        folder: 'drafts',
        category: 'primary',
        isRead: true,
        isStarred: false,
        isImportant: false,
        labels: [],
        attachments: body.attachments || [],
      };

      if (existing) {
        db.update(draftId, draftRecord);
      } else {
        db.insert(draftRecord);
      }

      sendJson(res, 200, { success: true, draft: draftRecord });
      return true;
    }

    // ─── PATCH /api/emails/:id ──────────────────────────────────
    if (emailMatch && method === 'PATCH') {
      const body = await parseJsonBody(req);
      const updated = db.update(emailMatch[1], body);
      if (!updated) {
        sendJson(res, 404, { error: 'Email not found' });
        return true;
      }
      sendJson(res, 200, { email: updated });
      return true;
    }

    // ─── POST /api/emails/batch ─────────────────────────────────
    if (pathname === '/api/emails/batch' && method === 'POST') {
      const body = await parseJsonBody(req);
      const { ids, action, folder, value } = body;

      if (!Array.isArray(ids)) {
        sendJson(res, 400, { error: 'Invalid ids array' });
        return true;
      }

      if (action === 'move' && folder) {
        db.moveToFolder(ids, folder);
      } else if (action === 'markRead') {
        ids.forEach(id => db.update(id, { isRead: value !== false }));
      } else if (action === 'star') {
        ids.forEach(id => db.update(id, { isStarred: value !== false }));
      } else if (action === 'deletePermanent') {
        ids.forEach(id => db.delete(id));
      }

      sendJson(res, 200, { success: true, count: ids.length });
      return true;
    }

    // ─── POST /api/attachments/upload ───────────────────────────
    if (pathname === '/api/attachments/upload' && method === 'POST') {
      const filename = decodeURIComponent((req.headers['x-filename'] as string) || `attachment_${Date.now()}`);
      const contentType = (req.headers['content-type'] as string) || 'application/octet-stream';
      const fileId = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}_${path.basename(filename)}`;
      const filePath = path.join(ATTACHMENTS_DIR, fileId);

      const buffer = await parseBufferBody(req);
      fs.writeFileSync(filePath, buffer);

      const sizeStr = buffer.length > 1024 * 1024
        ? `${(buffer.length / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(buffer.length / 1024)} KB`;

      sendJson(res, 201, {
        success: true,
        file: {
          id: fileId,
          name: filename,
          size: sizeStr,
          sizeBytes: buffer.length,
          type: contentType,
          downloadUrl: `/api/attachments/${encodeURIComponent(fileId)}/download`,
        },
      });
      return true;
    }

    // ─── GET /api/attachments/:id/download ──────────────────────
    const attachMatch = pathname.match(/^\/api\/attachments\/([^/]+)\/download$/);
    if (attachMatch && method === 'GET') {
      const fileId = decodeURIComponent(attachMatch[1]);
      const filePath = path.join(ATTACHMENTS_DIR, fileId);
      if (!fs.existsSync(filePath)) {
        sendJson(res, 404, { error: 'Attachment file not found' });
        return true;
      }
      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${fileId.split('_').slice(2).join('_') || fileId}"`,
      });
      fs.createReadStream(filePath).pipe(res);
      return true;
    }

    // ─── POST /api/emails/sync ──────────────────────────────────
    if (pathname === '/api/emails/sync' && method === 'POST') {
      sendJson(res, 200, {
        success: true,
        syncedAt: new Date().toISOString(),
        message: 'Mailbox synchronized with Sovereign Data Center',
      });
      return true;
    }

    // 404 for unmatched /api routes
    sendJson(res, 404, { error: `API route ${method} ${pathname} not found` });
    return true;
  } catch (err: any) {
    console.error('[API Error]:', err);
    sendJson(res, 500, { error: err.message || 'Internal server error' });
    return true;
  }
}
