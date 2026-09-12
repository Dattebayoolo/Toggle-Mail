// ============================================================
// Toggle Mail – Frontend Typed API Client
// Connects client state to backend mail engine
// ============================================================

import type { Email, Folder, Category } from './types';

export interface UserContext {
  id: string;
  email: string;
  displayName: string;
  avatarText: string;
  role: string;
  tenantId: string;
}

export interface StorageStats {
  usedBytes: number;
  limitBytes: number;
  usedFormatted: string;
  limitFormatted: string;
  percentage: number;
}

export interface SendPayload {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  attachments?: Array<{ name: string; size: string; type: string }>;
}

export interface SendResponse {
  success: boolean;
  messageId: string;
  record: Email;
  provider: string;
  timestamp: string;
  error?: string;
}

class ApiClient {
  private baseUrl = '/api';

  async getUser(): Promise<UserContext | null> {
    try {
      const res = await fetch(`${this.baseUrl}/user`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  }

  async getEmails(filter?: {
    folder?: Folder;
    category?: Category;
    label?: string;
    search?: string;
  }): Promise<Email[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.folder) params.set('folder', filter.folder);
      if (filter?.category) params.set('category', filter.category);
      if (filter?.label) params.set('label', filter.label);
      if (filter?.search) params.set('search', filter.search);

      const res = await fetch(`${this.baseUrl}/emails?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch emails');
      const data = await res.json();
      return data.emails || [];
    } catch (err) {
      console.warn('[ApiClient] Failed to fetch emails from backend, falling back to local cache:', err);
      return [];
    }
  }

  async getEmail(id: string): Promise<Email | null> {
    try {
      const res = await fetch(`${this.baseUrl}/emails/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.email;
    } catch {
      return null;
    }
  }

  async sendEmail(payload: SendPayload): Promise<SendResponse> {
    const res = await fetch(`${this.baseUrl}/emails/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to send email');
    }
    return res.json();
  }

  async saveDraft(draft: Partial<Email>): Promise<Email> {
    const res = await fetch(`${this.baseUrl}/emails/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (!res.ok) throw new Error('Failed to save draft');
    const data = await res.json();
    return data.draft;
  }

  async updateEmail(id: string, patch: Partial<Email>): Promise<Email | null> {
    try {
      const res = await fetch(`${this.baseUrl}/emails/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.email;
    } catch {
      return null;
    }
  }

  async batchAction(
    ids: string[],
    action: 'move' | 'markRead' | 'star' | 'deletePermanent',
    folder?: string,
    value?: boolean
  ): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/emails/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action, folder, value }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async sync(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/emails/sync`, { method: 'POST' });
      return res.json();
    } catch {
      return { success: false, message: 'Sync failed' };
    }
  }

  async getThreads(filter?: {
    folder?: Folder;
    category?: Category;
    label?: string;
    search?: string;
  }): Promise<import('./types').Thread[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.folder) params.set('folder', filter.folder);
      if (filter?.category) params.set('category', filter.category);
      if (filter?.label) params.set('label', filter.label);
      if (filter?.search) params.set('search', filter.search);

      const res = await fetch(`${this.baseUrl}/threads?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch threads');
      const data = await res.json();
      return data.threads || [];
    } catch (err) {
      console.warn('[ApiClient] Failed to fetch threads, falling back:', err);
      return [];
    }
  }

  async getThread(id: string): Promise<import('./types').Thread | null> {
    try {
      const res = await fetch(`${this.baseUrl}/threads/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.thread;
    } catch {
      return null;
    }
  }

  async uploadAttachment(file: File): Promise<{ name: string; size: string; type: string; downloadUrl: string } | null> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const res = await fetch(`${this.baseUrl}/attachments/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'X-Filename': encodeURIComponent(file.name),
        },
        body: arrayBuffer,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data.file;
    } catch (err) {
      console.error('[Upload Error]:', err);
      return null;
    }
  }

  subscribeToEvents(onEvent: (event: any) => void): () => void {
    if (typeof EventSource === 'undefined') return () => {};
    const es = new EventSource(`${this.baseUrl}/events`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onEvent(data);
      } catch {}
    };
    es.onerror = () => {
      // Reconnects automatically
    };
    return () => es.close();
  }

  async getStorage(): Promise<StorageStats | null> {
    try {
      const res = await fetch(`${this.baseUrl}/storage`);
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }
}

export const api = new ApiClient();
