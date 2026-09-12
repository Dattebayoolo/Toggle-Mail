// ============================================================
// Toggle Mail – Conversation Threading Engine
// Groups messages into Gmail-style conversation threads
// ============================================================

import type { EmailRecord } from './db';

export interface ThreadRecord {
  id: string;
  subject: string;
  snippet: string;
  participants: Array<{ name: string; email: string; avatar: string }>;
  messageCount: number;
  unreadCount: number;
  hasAttachments: boolean;
  isStarred: boolean;
  isImportant: boolean;
  labels: string[];
  lastDate: string;
  folder: EmailRecord['folder'];
  category: EmailRecord['category'];
  messages: EmailRecord[];
}

export function normalizeSubject(subj: string): string {
  if (!subj) return '(no subject)';
  return subj
    .replace(/^(re|fwd|fw|aw|vs|antw):\s*/gi, '')
    .replace(/\[external\]\s*/gi, '')
    .trim();
}

export function buildThreads(emails: EmailRecord[]): ThreadRecord[] {
  const map = new Map<string, EmailRecord[]>();

  for (const em of emails) {
    const key = em.threadId || `subj_${normalizeSubject(em.subject).toLowerCase()}`;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(em);
  }

  const threads: ThreadRecord[] = [];

  for (const [threadId, msgs] of map.entries()) {
    // Sort messages chronologically (oldest first, newest last)
    msgs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const latest = msgs[msgs.length - 1];
    const unreadCount = msgs.filter(m => !m.isRead).length;
    const isStarred = msgs.some(m => m.isStarred);
    const isImportant = msgs.some(m => m.isImportant);
    const hasAttachments = msgs.some(m => m.attachments && m.attachments.length > 0);

    // Collect unique participants preserving order
    const participantMap = new Map<string, { name: string; email: string; avatar: string }>();
    msgs.forEach(m => {
      if (!participantMap.has(m.fromEmail)) {
        participantMap.set(m.fromEmail, {
          name: m.fromName || m.fromEmail,
          email: m.fromEmail,
          avatar: m.fromAvatar || m.fromName?.substring(0, 2).toUpperCase() || 'U',
        });
      }
    });

    // Merge unique labels across messages
    const labelSet = new Set<string>();
    msgs.forEach(m => (m.labels || []).forEach(l => labelSet.add(l)));

    threads.push({
      id: threadId,
      subject: normalizeSubject(latest.subject),
      snippet: latest.snippet,
      participants: Array.from(participantMap.values()),
      messageCount: msgs.length,
      unreadCount,
      hasAttachments,
      isStarred,
      isImportant,
      labels: Array.from(labelSet),
      lastDate: latest.date,
      folder: latest.folder,
      category: latest.category,
      messages: msgs,
    });
  }

  // Sort threads by most recent message first
  return threads.sort((a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime());
}
