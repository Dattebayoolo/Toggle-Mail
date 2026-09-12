import type {
  Email, Label, Task, Note, Contact, CalendarEvent,
  Theme, Density, Lang, Folder, Category, UndoItem,
} from './types';
import {
  INITIAL_EMAILS, INITIAL_CONTACTS, INITIAL_TASKS,
  INITIAL_NOTES, PAKISTAN_HOLIDAYS,
} from './mock-data';
import { api, type UserContext } from './api-client';

type Listener = () => void;

class AppState {
  // ── Persistent: loaded from localStorage ─────────────────
  emails: Email[];
  theme: Theme;
  density: Density;
  lang: Lang;
  labels: Label[];
  tasks: Task[];
  notes: Note[];
  contacts: Contact[];
  holidays: CalendarEvent[];
  currentUser: UserContext | null = null;

  // ── Session ───────────────────────────────────────────────
  activeFolder: Folder = 'inbox';
  activeCategory: Category = 'primary';
  selectedEmailId: string | null = null;
  selectedIds: Set<string> = new Set();
  searchQuery: string = '';
  sidebarOpen: boolean = true;
  undoStack: UndoItem[] = [];

  private listeners: Listener[] = [];

  constructor() {
    this.emails    = this.load('tm_emails', INITIAL_EMAILS);
    this.theme     = this.load('tm_theme', 'light');
    this.density   = this.load('tm_density', 'comfortable');
    this.lang      = this.load('tm_lang', 'en');
    this.labels    = this.load('tm_labels', [
      { name: 'Raast & Banking', color: '#0b6623' },
      { name: 'FBR & Tax', color: '#1a5276' },
      { name: 'NADRA', color: '#6c3483' },
      { name: 'Freelance & IT', color: '#1a7f64' },
      { name: 'Orders & E-commerce', color: '#e67e22' },
    ]);
    this.tasks     = this.load('tm_tasks', INITIAL_TASKS);
    this.notes     = this.load('tm_notes', INITIAL_NOTES);
    this.contacts  = this.load('tm_contacts', INITIAL_CONTACTS);
    this.holidays  = PAKISTAN_HOLIDAYS;

    // Apply persisted theme immediately
    document.documentElement.setAttribute('data-theme', this.theme);

    // Asynchronously connect & sync with backend mail engine
    this.initBackend();
  }

  async initBackend() {
    try {
      const user = await api.getUser();
      if (user) {
        this.currentUser = user;
      }
      const liveEmails = await api.getEmails();
      if (liveEmails && liveEmails.length > 0) {
        this.emails = liveEmails;
        this.save('tm_emails', this.emails);
        this.notify();
      }
    } catch (err) {
      console.warn('[State] Offline/local mode active:', err);
    }
  }

  private load<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch { return fallback; }
  }

  private save<T>(key: string, value: T) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  notify() { this.listeners.forEach(l => l()); }

  // ── Theme ─────────────────────────────────────────────────
  setTheme(t: Theme) {
    this.theme = t;
    document.documentElement.setAttribute('data-theme', t);
    this.save('tm_theme', t);
    this.notify();
  }

  // ── Density ───────────────────────────────────────────────
  setDensity(d: Density) {
    this.density = d;
    document.body.setAttribute('data-density', d);
    this.save('tm_density', d);
    this.notify();
  }

  // ── Navigation ────────────────────────────────────────────
  navigate(folder: Folder) {
    this.activeFolder = folder;
    this.selectedEmailId = null;
    this.selectedIds.clear();
    this.searchQuery = '';
    this.notify();
  }

  setCategory(cat: Category) {
    this.activeCategory = cat;
    this.selectedEmailId = null;
    this.selectedIds.clear();
    this.notify();
  }

  setSearch(q: string) {
    this.searchQuery = q;
    this.selectedEmailId = null;
    this.selectedIds.clear();
    this.notify();
  }

  openEmail(id: string) {
    this.selectedEmailId = id;
    const em = this.emails.find(e => e.id === id);
    if (em && !em.isRead) {
      em.isRead = true;
      this.save('tm_emails', this.emails);
    }
    this.notify();
  }

  closeEmail() {
    this.selectedEmailId = null;
    this.notify();
  }

  // ── Email Actions ─────────────────────────────────────────
  toggleStar(id: string) {
    const em = this.emails.find(e => e.id === id);
    if (em) { em.isStarred = !em.isStarred; this.save('tm_emails', this.emails); this.notify(); }
  }

  toggleRead(id: string) {
    const em = this.emails.find(e => e.id === id);
    if (em) { em.isRead = !em.isRead; this.save('tm_emails', this.emails); this.notify(); }
  }

  markAllRead() {
    const visible = this.getFilteredEmails().map(e => e.id);
    this.emails.forEach(e => { if (visible.includes(e.id)) e.isRead = true; });
    this.save('tm_emails', this.emails);
    this.notify();
  }

  archiveEmail(id: string) {
    const em = this.emails.find(e => e.id === id);
    if (!em) return;
    const prev = em.folder;
    em.folder = 'archive';
    this.undoStack.push({ action: 'archive', items: [{ id, prevFolder: prev }] });
    if (this.selectedEmailId === id) this.selectedEmailId = null;
    this.save('tm_emails', this.emails);
    this.notify();
  }

  deleteEmail(id: string) {
    const em = this.emails.find(e => e.id === id);
    if (!em) return;
    const prev = em.folder;
    if (prev === 'trash') {
      this.emails = this.emails.filter(e => e.id !== id);
    } else {
      em.folder = 'trash';
      this.undoStack.push({ action: 'delete', items: [{ id, prevFolder: prev }] });
    }
    if (this.selectedEmailId === id) this.selectedEmailId = null;
    this.save('tm_emails', this.emails);
    this.notify();
  }

  snoozeEmail(id: string, until: string) {
    const em = this.emails.find(e => e.id === id);
    if (em) { em.isSnoozed = true; em.snoozeUntil = until; em.folder = 'snoozed'; this.save('tm_emails', this.emails); this.notify(); }
  }

  moveEmail(id: string, folder: Email['folder']) {
    const em = this.emails.find(e => e.id === id);
    if (em) { em.folder = folder; this.save('tm_emails', this.emails); this.notify(); }
  }

  addLabel(id: string, label: string) {
    const em = this.emails.find(e => e.id === id);
    if (em && !em.labels.includes(label)) { em.labels.push(label); this.save('tm_emails', this.emails); this.notify(); }
  }

  undo() {
    const item = this.undoStack.pop();
    if (!item) return;
    item.items.forEach(({ id, prevFolder }) => {
      const em = this.emails.find(e => e.id === id);
      if (em) em.folder = prevFolder as Email['folder'];
    });
    this.save('tm_emails', this.emails);
    this.notify();
  }

  // ── Bulk selection ────────────────────────────────────────
  toggleSelect(id: string) {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
    this.notify();
  }

  selectAll() {
    this.getFilteredEmails().forEach(e => this.selectedIds.add(e.id));
    this.notify();
  }

  selectNone() { this.selectedIds.clear(); this.notify(); }
  selectRead() { this.getFilteredEmails().filter(e => e.isRead).forEach(e => this.selectedIds.add(e.id)); this.notify(); }
  selectUnread() { this.getFilteredEmails().filter(e => !e.isRead).forEach(e => this.selectedIds.add(e.id)); this.notify(); }
  selectStarred() { this.getFilteredEmails().filter(e => e.isStarred).forEach(e => this.selectedIds.add(e.id)); this.notify(); }

  bulkArchive() {
    this.selectedIds.forEach(id => this.archiveEmail(id));
    this.selectedIds.clear();
    this.notify();
  }

  bulkDelete() {
    this.selectedIds.forEach(id => this.deleteEmail(id));
    this.selectedIds.clear();
    this.notify();
  }

  bulkMarkRead() {
    this.selectedIds.forEach(id => {
      const em = this.emails.find(e => e.id === id);
      if (em) em.isRead = true;
    });
    this.selectedIds.clear();
    this.save('tm_emails', this.emails);
    this.notify();
  }

  // ── Send new email ────────────────────────────────────────
  async sendEmail(to: string, subject: string, body: string, cc = '', bcc = '', attachments: import('./types').Attachment[] = []) {
    const senderEmail = this.currentUser?.email || 'kazam@togglemail.pk';
    const senderName  = this.currentUser?.displayName || 'Kazam Mahmood';
    const senderAvatar= this.currentUser?.avatarText || 'KM';

    const tempId = `em-${Date.now()}`;
    const newEmail: Email = {
      id: tempId,
      from: `${senderName} <${senderEmail}>`,
      fromName: senderName,
      fromAvatar: senderAvatar,
      fromEmail: senderEmail,
      to, cc, bcc, subject,
      snippet: body.replace(/<[^>]*>/g, '').slice(0, 100),
      body,
      date: new Date().toISOString(),
      folder: 'sent',
      category: 'primary',
      isRead: true,
      isStarred: false,
      isImportant: false,
      labels: [],
      attachments: attachments || [],
    };

    // Optimistic local update
    this.emails.unshift(newEmail);
    this.save('tm_emails', this.emails);
    this.notify();

    // Live dispatch via backend engine
    try {
      const res = await api.sendEmail({ to, cc, bcc, subject, body, attachments });
      if (res?.record) {
        const idx = this.emails.findIndex(e => e.id === tempId);
        if (idx !== -1) {
          this.emails[idx] = res.record;
          this.save('tm_emails', this.emails);
          this.notify();
        }
      }
    } catch (err) {
      console.warn('[State] Sent locally (offline / mock delivery):', err);
    }
  }

  async saveDraft(to: string, subject: string, body: string) {
    const senderEmail = this.currentUser?.email || 'kazam@togglemail.pk';
    const senderName  = this.currentUser?.displayName || 'Kazam Mahmood';
    const draftId = `draft-${Date.now()}`;

    const draft: Email = {
      id: draftId,
      from: `${senderName} <${senderEmail}>`,
      fromName: `${senderName} (Draft)`,
      fromAvatar: this.currentUser?.avatarText || 'KM',
      fromEmail: senderEmail,
      to, subject,
      snippet: body.replace(/<[^>]*>/g, '').slice(0, 80),
      body,
      date: new Date().toISOString(),
      folder: 'drafts',
      category: 'primary',
      isRead: true, isStarred: false, isImportant: false,
      labels: ['Draft'], attachments: [],
    };

    this.emails.unshift(draft);
    this.save('tm_emails', this.emails);
    this.notify();

    api.saveDraft({ id: draftId, to, subject, body }).catch(e => console.warn('[Draft API]:', e));
  }

  // ── Tasks ─────────────────────────────────────────────────
  addTask(text: string, date = '') {
    this.tasks.unshift({ id: `tsk-${Date.now()}`, text, completed: false, date });
    this.save('tm_tasks', this.tasks);
    this.notify();
  }

  toggleTask(id: string) {
    const t = this.tasks.find(t => t.id === id);
    if (t) { t.completed = !t.completed; this.save('tm_tasks', this.tasks); this.notify(); }
  }

  deleteTask(id: string) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.save('tm_tasks', this.tasks);
    this.notify();
  }

  // ── Notes ─────────────────────────────────────────────────
  addNote(title: string, content: string) {
    this.notes.unshift({ id: `not-${Date.now()}`, title, content, updatedAt: 'Just now' });
    this.save('tm_notes', this.notes);
    this.notify();
  }

  deleteNote(id: string) {
    this.notes = this.notes.filter(n => n.id !== id);
    this.save('tm_notes', this.notes);
    this.notify();
  }

  // ── Contacts ──────────────────────────────────────────────
  addContact(name: string, email: string, phone = '', role = '') {
    this.contacts.unshift({ name, email, phone, role });
    this.save('tm_contacts', this.contacts);
    this.notify();
  }

  // ── Labels ────────────────────────────────────────────────
  createLabel(name: string, color = '#1a73e8') {
    if (this.labels.find(l => l.name === name)) return;
    this.labels.push({ name, color });
    this.save('tm_labels', this.labels);
    this.notify();
  }

  // ── Filtered view ─────────────────────────────────────────
  getFilteredEmails(): Email[] {
    let results = this.emails;
    const q = this.searchQuery.trim().toLowerCase();

    if (q) {
      // Advanced search operators
      const ops: Record<string, string> = {};
      const plain: string[] = [];
      q.split(/\s+/).forEach(tok => {
        const m = tok.match(/^(\w+):(.+)$/);
        if (m) ops[m[1]] = m[2];
        else plain.push(tok);
      });

      results = results.filter(e => {
        if (ops['from']    && !e.fromEmail.includes(ops['from']) && !e.fromName.toLowerCase().includes(ops['from'])) return false;
        if (ops['to']      && !e.to.toLowerCase().includes(ops['to'])) return false;
        if (ops['subject'] && !e.subject.toLowerCase().includes(ops['subject'])) return false;
        if (ops['label']   && !e.labels.some(l => l.toLowerCase().includes(ops['label']))) return false;
        if (ops['is']      === 'unread' && e.isRead) return false;
        if (ops['is']      === 'read'   && !e.isRead) return false;
        if (ops['is']      === 'starred' && !e.isStarred) return false;
        if (ops['has']     === 'attachment' && e.attachments.length === 0) return false;
        const text = `${e.from} ${e.subject} ${e.snippet} ${e.body}`.toLowerCase();
        return plain.every(p => text.includes(p));
      });
    } else {
      // Folder filter
      switch (this.activeFolder) {
        case 'inbox':    results = results.filter(e => e.folder === 'inbox' && !e.isSnoozed); break;
        case 'starred':  results = results.filter(e => e.isStarred); break;
        case 'snoozed':  results = results.filter(e => e.isSnoozed); break;
        case 'sent':     results = results.filter(e => e.folder === 'sent'); break;
        case 'drafts':   results = results.filter(e => e.folder === 'drafts'); break;
        case 'important':results = results.filter(e => e.isImportant); break;
        case 'allMail':  results = results.filter(e => e.folder !== 'trash' && e.folder !== 'spam'); break;
        case 'spam':     results = results.filter(e => e.folder === 'spam'); break;
        case 'trash':    results = results.filter(e => e.folder === 'trash'); break;
      }

      // Category filter (inbox only)
      if (this.activeFolder === 'inbox') {
        results = results.filter(e => e.category === this.activeCategory);
      }
    }

    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getUnreadCount(folder: Folder): number {
    return this.emails.filter(e => {
      if (folder === 'inbox') return e.folder === 'inbox' && !e.isRead;
      if (folder === 'drafts') return e.folder === 'drafts';
      return false;
    }).length;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    this.notify();
  }
}

export const state = new AppState();
