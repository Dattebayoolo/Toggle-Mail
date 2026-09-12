// ============================================================
// Toggle Mail – Persistent Database Engine (JSON File Backed)
// Thread-safe atomic file persistence for emails, threads, drafts
// ============================================================

import fs from 'node:fs';
import path from 'node:path';

export interface EmailRecord {
  id: string;
  from: string;
  fromName: string;
  fromAvatar: string;
  fromEmail: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  folder: 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash' | 'archive' | 'snoozed';
  category: 'primary' | 'promotions' | 'social' | 'updates';
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  isSnoozed?: boolean;
  snoozeUntil?: string;
  labels: string[];
  attachments: Array<{ name: string; size: string; type: string }>;
  threadId?: string;
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const EMAILS_FILE = path.join(DB_DIR, 'emails.json');

class DatabaseEngine {
  private emails: EmailRecord[] = [];
  private initialized = false;

  constructor() {
    this.ensureDir();
    this.load();
  }

  private ensureDir() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  }

  private load() {
    try {
      if (fs.existsSync(EMAILS_FILE)) {
        const raw = fs.readFileSync(EMAILS_FILE, 'utf-8');
        this.emails = JSON.parse(raw);
        this.initialized = true;
      } else {
        this.seedInitial();
      }
    } catch (err) {
      console.error('[DB] Failed to load emails from disk:', err);
      this.seedInitial();
    }
  }

  private seedInitial() {
    // Initial Pakistani sovereign & business seed emails
    this.emails = [
      {
        id: 'em-1',
        from: 'State Bank of Pakistan <notifications@sbp.org.pk>',
        fromName: 'State Bank of Pakistan (Raast)',
        fromAvatar: 'SBP',
        fromEmail: 'notifications@sbp.org.pk',
        to: 'kazam@togglemail.pk',
        subject: 'Raast Instant Settlement: PKR 45,000 received in your Account',
        snippet: 'Dear Customer, an instant payment settlement of PKR 45,000 via Raast P2P transfer has been processed...',
        body: `<p>Dear Customer,</p><p>We are pleased to inform you that an instant settlement of <strong>PKR 45,000</strong> has been credited to your linked IBAN account via <strong>Raast National Payment System</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #dadce0">
          <tr style="background:#f1f3f4"><th style="padding:8px;text-align:left">Transaction ID</th><th style="padding:8px;text-align:left">RST-202609-88129</th></tr>
          <tr><td style="padding:8px">Sender</td><td style="padding:8px">TechNova Labs Ltd</td></tr>
          <tr style="background:#f1f3f4"><td style="padding:8px">Timestamp</td><td style="padding:8px">${new Date().toISOString()}</td></tr>
          <tr><td style="padding:8px">Clearing Center</td><td style="padding:8px">National Clearing (1LINK / SBP)</td></tr>
        </table>
        <p style="color:#0b6623;font-weight:600">This transaction was settled in real-time under Sovereign Financial Data Governance.</p>`,
        date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        folder: 'inbox',
        category: 'primary',
        isRead: false,
        isStarred: true,
        isImportant: true,
        labels: ['Raast & Banking'],
        attachments: [
          { name: 'Raast_Receipt_88129.pdf', size: '142 KB', type: 'application/pdf' },
        ],
      },
      {
        id: 'em-2',
        from: 'Federal Board of Revenue <iris@fbr.gov.pk>',
        fromName: 'FBR IRIS Portal',
        fromAvatar: 'FBR',
        fromEmail: 'iris@fbr.gov.pk',
        to: 'kazam@togglemail.pk',
        subject: 'Active Taxpayer List (ATL) Status Confirmed for Tax Year 2026',
        snippet: 'Your National Tax Number (NTN) registration status has been verified. You remain on the Active Taxpayers List...',
        body: `<p>Dear Taxpayer,</p><p>This is to confirm that your Annual Tax Return for Tax Year 2026 has been successfully verified on the <strong>IRIS Federal Board of Revenue Portal</strong>.</p>
        <p>Your status on the <strong>Active Taxpayer List (ATL)</strong> is confirmed active with 100% withholding tax concessions applied across all banking transactions.</p>`,
        date: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        folder: 'inbox',
        category: 'primary',
        isRead: true,
        isStarred: false,
        isImportant: true,
        labels: ['FBR & Tax'],
        attachments: [],
      },
      {
        id: 'em-3',
        from: 'NADRA Pak-ID <support@nadra.gov.pk>',
        fromName: 'NADRA Sovereign Identity',
        fromAvatar: 'NAD',
        fromEmail: 'support@nadra.gov.pk',
        to: 'kazam@togglemail.pk',
        subject: 'National ID Digital Verification (Pak-ID) Renewal Complete',
        snippet: 'Your Smart National ID Card (SNIC) digital verification process has concluded successfully...',
        body: `<p>Dear Citizen,</p><p>Your application for Smart National Identity Card (SNIC) digital credentials renewal has been approved by the National Database and Registration Authority (NADRA).</p>`,
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        folder: 'inbox',
        category: 'updates',
        isRead: true,
        isStarred: false,
        isImportant: false,
        labels: ['NADRA'],
        attachments: [],
      }
    ];
    this.save();
  }

  private save() {
    try {
      this.ensureDir();
      const tmpFile = `${EMAILS_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.emails, null, 2), 'utf-8');
      fs.renameSync(tmpFile, EMAILS_FILE);
    } catch (err) {
      console.error('[DB] Failed to save emails to disk:', err);
    }
  }

  // ─── Query Operations ───────────────────────────────────────────────────────
  getAll(filter?: {
    folder?: string;
    category?: string;
    label?: string;
    search?: string;
    starred?: boolean;
    important?: boolean;
  }): EmailRecord[] {
    let res = [...this.emails];

    if (filter?.folder) {
      if (filter.folder === 'allMail') {
        res = res.filter(e => e.folder !== 'trash' && e.folder !== 'spam');
      } else if (filter.folder === 'starred') {
        res = res.filter(e => e.isStarred);
      } else if (filter.folder === 'important') {
        res = res.filter(e => e.isImportant);
      } else {
        res = res.filter(e => e.folder === filter.folder);
      }
    }

    if (filter?.category && (!filter.folder || filter.folder === 'inbox')) {
      res = res.filter(e => e.category === filter.category);
    }

    if (filter?.label) {
      res = res.filter(e => e.labels.includes(filter.label!));
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      res = res.filter(e =>
        e.subject.toLowerCase().includes(q) ||
        e.from.toLowerCase().includes(q) ||
        e.fromName.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q)
      );
    }

    return res.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getById(id: string): EmailRecord | undefined {
    return this.emails.find(e => e.id === id);
  }

  insert(record: EmailRecord): EmailRecord {
    this.emails.unshift(record);
    this.save();
    return record;
  }

  update(id: string, updates: Partial<EmailRecord>): EmailRecord | undefined {
    const idx = this.emails.findIndex(e => e.id === id);
    if (idx === -1) return undefined;
    this.emails[idx] = { ...this.emails[idx], ...updates };
    this.save();
    return this.emails[idx];
  }

  delete(id: string): boolean {
    const idx = this.emails.findIndex(e => e.id === id);
    if (idx === -1) return false;
    this.emails.splice(idx, 1);
    this.save();
    return true;
  }

  moveToFolder(ids: string[], folder: EmailRecord['folder']): void {
    this.emails = this.emails.map(e => (ids.includes(e.id) ? { ...e, folder } : e));
    this.save();
  }

  getStorageStats() {
    const totalBytes = this.emails.reduce((acc, e) => acc + (e.body?.length || 0) + 1024, 0);
    const limitBytes = 25 * 1024 * 1024 * 1024; // 25 GB Sovereign quota
    return {
      usedBytes: totalBytes,
      limitBytes,
      usedFormatted: `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`,
      limitFormatted: '25 GB',
      percentage: Math.min(100, Math.max(1, Math.round((totalBytes / limitBytes) * 100 * 1000) / 1000)),
    };
  }
}

export const db = new DatabaseEngine();
