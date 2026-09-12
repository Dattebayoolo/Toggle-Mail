// Toggle Mail – Main UI Controller (TypeScript)
// Full Google-style Material 3 email client – every button wired

import { state } from './state';
import { sounds } from './sound';
import { i18n } from './localization';
import { compose } from './compose';
import { PAKISTAN_PRAYER_TIMES } from './mock-data';
import type { Email, Folder, Theme, Thread } from './types';
import { api } from './api-client';

// ─── Helpers ────────────────────────────────────────────────────────────────

function $(id: string): HTMLElement | null { return document.getElementById(id); }
function el<T extends HTMLElement = HTMLElement>(id: string): T { return document.getElementById(id) as T; }

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / 3_600_000;
  if (diffH < 24 && d.getDate() === now.getDate()) return d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  if (diffH < 168) return d.toLocaleDateString('en-PK', { weekday: 'short' });
  return d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
}

function showToast(msg: string, icon = 'info', undoable = false) {
  document.querySelectorAll('.toast-notification').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast-notification';
  t.innerHTML = `
    <span class="material-symbols-outlined">${icon}</span>
    <span>${msg}</span>
    ${undoable ? `<button class="toast-undo-btn" id="toast-undo">Undo</button>` : ''}
  `;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('toast-visible'), 10);
  const duration = undoable ? 5000 : 3000;
  const timer = setTimeout(() => { t.classList.remove('toast-visible'); setTimeout(() => t.remove(), 300); }, duration);
  if (undoable) {
    t.querySelector('#toast-undo')?.addEventListener('click', () => {
      clearTimeout(timer);
      state.undo();
      t.remove();
      showToast('Action undone', 'undo');
    });
  }
}

// ─── UIController ────────────────────────────────────────────────────────────

class UIController {
  private activeSidePanel: string | null = null;
  private sidebarCollapsed = false;

  init() {
    this.applyTheme();
    this.bindAll();
    state.subscribe(() => this.render());
    this.render();
    i18n.applyToDOM();
  }

  private applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    document.body.setAttribute('data-density', state.density);
  }

  // ─── Render entry-point ────────────────────────────────────────────────────
  private render() {
    this.renderSidebar();
    this.renderCategoryTabs();
    this.renderEmailList();
    this.renderActionBar();
    this.updateThemeIcon();
    if (state.selectedEmailId) this.renderEmailDetail(state.selectedEmailId);
    else this.showListView();
  }

  private showListView() {
    const list = $('email-list-view');
    const detail = $('email-detail-view');
    if (list)   list.style.display = 'flex';
    if (detail) detail.style.display = 'none';
  }

  // ─── Sidebar ──────────────────────────────────────────────────────────────
  private renderSidebar() {
    const navItems: Array<{ folder: Folder; icon: string; label: string }> = [
      { folder: 'inbox',    icon: 'inbox',          label: 'Inbox' },
      { folder: 'starred',  icon: 'star',           label: 'Starred' },
      { folder: 'snoozed',  icon: 'snooze',         label: 'Snoozed' },
      { folder: 'sent',     icon: 'send',           label: 'Sent' },
      { folder: 'drafts',   icon: 'draft',          label: 'Drafts' },
      { folder: 'important',icon: 'label_important', label: 'Important' },
      { folder: 'allMail',  icon: 'all_inbox',      label: 'All Mail' },
      { folder: 'spam',     icon: 'report',         label: 'Spam' },
      { folder: 'trash',    icon: 'delete',         label: 'Trash' },
    ];

    const nav = $('sidebar-nav');
    if (!nav) return;
    nav.innerHTML = navItems.map(({ folder, icon, label }) => {
      const count = state.getUnreadCount(folder);
      const active = state.activeFolder === folder;
      return `
        <button class="nav-item sidebar-nav-item ${active ? 'active' : ''}" data-folder="${folder}" title="${label}">
          <span class="material-symbols-outlined nav-icon sidebar-nav-icon ${active ? 'filled' : ''}">${icon}</span>
          <span class="nav-label sidebar-nav-label">${label}</span>
          ${count > 0 ? `<span class="nav-badge sidebar-nav-count">${count}</span>` : ''}
        </button>`;
    }).join('');

    // Labels
    const labelEl = $('sidebar-labels');
    if (labelEl) {
      labelEl.innerHTML = state.labels.map(l => `
        <button class="sidebar-nav-item sidebar-label-item" data-label="${l.name}">
          <span class="sidebar-label-dot" style="background:${l.color}"></span>
          <span class="sidebar-nav-label">${l.name}</span>
        </button>`).join('');
      labelEl.querySelectorAll<HTMLElement>('[data-label]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.searchQuery = `label:${btn.dataset['label']}`;
          state.notify();
        });
      });
    }

    nav.querySelectorAll<HTMLElement>('[data-folder]').forEach(btn => {
      btn.addEventListener('click', () => state.navigate(btn.dataset['folder'] as Folder));
    });
  }

  // ─── Category Tabs ────────────────────────────────────────────────────────
  private renderCategoryTabs() {
    const tabs = $('category-tabs');
    if (!tabs) return;
    tabs.style.display = state.activeFolder === 'inbox' ? 'flex' : 'none';
    if (state.activeFolder !== 'inbox') return;

    const cats = [
      { key: 'primary', icon: 'inbox', label: 'Primary' },
      { key: 'promotions', icon: 'local_offer', label: 'Promotions' },
      { key: 'social', icon: 'people', label: 'Social' },
      { key: 'updates', icon: 'info', label: 'Updates' },
    ];

    tabs.innerHTML = cats.map(c => `
      <button class="category-tab ${state.activeCategory === c.key ? 'active' : ''}" data-cat="${c.key}">
        <span class="material-symbols-outlined">${c.icon}</span>
        <span>${c.label}</span>
        ${state.emails.filter(e => e.folder === 'inbox' && e.category === c.key && !e.isRead).length > 0
          ? `<span class="cat-badge">${state.emails.filter(e => e.folder === 'inbox' && e.category === c.key && !e.isRead).length}</span>` : ''}
      </button>`).join('');

    tabs.querySelectorAll<HTMLElement>('[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => state.setCategory(btn.dataset['cat'] as any));
    });
  }

  // ─── Action Bar ───────────────────────────────────────────────────────────
  private renderActionBar() {
    const countEl = $('selected-count');
    if (countEl) {
      const n = state.selectedIds.size;
      countEl.textContent = n > 0 ? `${n} selected` : '';
    }
    const bulkBar = $('bulk-actions-bar');
    if (bulkBar) bulkBar.style.display = state.selectedIds.size > 0 ? 'flex' : 'none';
  }

  // ─── Email List ───────────────────────────────────────────────────────────
  private renderEmailList() {
    const listEl = $('email-list');
    if (!listEl) return;
    const emails = state.getFilteredEmails();

    if (emails.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <span class="material-symbols-outlined empty-state-icon">mark_email_read</span>
          <p class="empty-state-text">${i18n.t('emptyInbox')}</p>
        </div>`;
      return;
    }

    listEl.innerHTML = emails.map(em => this.emailRow(em)).join('');

    listEl.querySelectorAll<HTMLElement>('.email-row').forEach(row => {
      const id = row.dataset['id']!;
      row.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        if (target.closest('.email-row-checkbox-wrap') || target.closest('.email-star-btn')) return;
        state.openEmail(id);
        sounds.click();
      });
      row.querySelector('.email-row-checkbox-wrap')?.addEventListener('click', e => {
        e.stopPropagation();
        state.toggleSelect(id);
      });
      row.querySelector('.email-star-btn')?.addEventListener('click', e => {
        e.stopPropagation();
        state.toggleStar(id);
        sounds.star();
      });
      // Hover action buttons
      row.querySelector('.email-action-archive')?.addEventListener('click', e => {
        e.stopPropagation();
        state.archiveEmail(id);
        sounds.archive();
        showToast('Archived', 'archive', true);
      });
      row.querySelector('.email-action-delete')?.addEventListener('click', e => {
        e.stopPropagation();
        state.deleteEmail(id);
        sounds.trash();
        showToast(i18n.t('movedToTrash'), 'delete', true);
      });
      row.querySelector('.email-action-read')?.addEventListener('click', e => {
        e.stopPropagation();
        state.toggleRead(id);
      });
      row.querySelector('.email-action-snooze')?.addEventListener('click', e => {
        e.stopPropagation();
        this.showSnoozeMenu(id);
      });
    });
  }

  private emailRow(em: Email): string {
    const selected = state.selectedIds.has(em.id);
    const avatar = em.fromAvatar.length <= 3
      ? `<div class="email-avatar" style="background:${this.avatarColor(em.fromAvatar)}">${em.fromAvatar}</div>`
      : `<div class="email-avatar">${em.fromAvatar[0]}</div>`;

    return `
      <div class="email-row ${em.isRead ? 'read' : 'unread'} ${selected ? 'selected' : ''}" data-id="${em.id}">
        <div class="email-row-left">
          <div class="email-row-checkbox-wrap">
            <input type="checkbox" class="email-checkbox" ${selected ? 'checked' : ''} tabindex="-1">
            <div class="email-avatar-wrap">${avatar}</div>
          </div>
          <button class="email-star-btn icon-btn" title="Star">
            <span class="material-symbols-outlined ${em.isStarred ? 'star-filled' : ''}" style="font-size:18px;color:${em.isStarred ? '#f9ab00' : 'inherit'}">${em.isStarred ? 'star' : 'star_border'}</span>
          </button>
        </div>
        <div class="email-row-body">
          <span class="email-sender">${em.fromName}</span>
          ${em.isImportant ? `<span class="material-symbols-outlined email-important-icon">label_important</span>` : ''}
          <span class="email-subject">${em.subject}</span>
          <span class="email-snippet"> – ${em.snippet}</span>
          ${em.attachments.length > 0 ? `<span class="material-symbols-outlined email-attachment-icon">attach_file</span>` : ''}
          ${em.labels.map(l => {
            const labelObj = state.labels.find(lb => lb.name === l);
            return `<span class="email-label-chip" style="background:${labelObj?.color ?? '#5f6368'}20;color:${labelObj?.color ?? '#5f6368'}">${l}</span>`;
          }).join('')}
        </div>
        <div class="email-row-right">
          <div class="email-hover-actions">
            <button class="icon-btn email-action-archive" title="Archive"><span class="material-symbols-outlined">archive</span></button>
            <button class="icon-btn email-action-delete" title="Delete"><span class="material-symbols-outlined">delete</span></button>
            <button class="icon-btn email-action-read" title="${em.isRead ? 'Mark unread' : 'Mark read'}">
              <span class="material-symbols-outlined">${em.isRead ? 'mark_email_unread' : 'mark_email_read'}</span>
            </button>
            <button class="icon-btn email-action-snooze" title="Snooze"><span class="material-symbols-outlined">snooze</span></button>
          </div>
          <span class="email-date">${fmtDate(em.date)}</span>
        </div>
      </div>`;
  }

  private avatarColor(str: string): string {
    const colors = ['#1a73e8','#0b6623','#d93025','#f9ab00','#1e8e3e','#8430ce','#e37400','#00796b'];
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + (h << 5) - h;
    return colors[Math.abs(h) % colors.length];
  }

  // ─── Email Detail (Threaded Conversation View) ────────────────────────────
  private renderEmailDetail(id: string) {
    const em = state.emails.find(e => e.id === id);
    const detailEl = $('email-detail-view');
    const listEl = $('email-list-view');
    if (!em || !detailEl) return;

    if (listEl) listEl.style.display = 'none';
    detailEl.style.display = 'flex';

    // Render toolbar + skeleton immediately
    detailEl.innerHTML = this.buildDetailShell(em, id);
    this.wireDetailToolbar(em, id, detailEl);

    // Async: fetch thread and render conversation cards
    this.renderThreadCards(em, id, detailEl);
  }

  private buildDetailShell(em: Email, id: string): string {
    return `
      <div class="detail-toolbar">
        <button class="icon-btn" id="detail-back-btn" title="Back to inbox">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div class="detail-toolbar-actions">
          <button class="icon-btn" id="detail-archive-btn" title="Archive"><span class="material-symbols-outlined">archive</span></button>
          <button class="icon-btn" id="detail-spam-btn" title="Report spam"><span class="material-symbols-outlined">report</span></button>
          <button class="icon-btn" id="detail-delete-btn" title="Delete"><span class="material-symbols-outlined">delete</span></button>
          <div class="toolbar-divider"></div>
          <button class="icon-btn" id="detail-unread-btn" title="Mark as unread"><span class="material-symbols-outlined">mark_email_unread</span></button>
          <button class="icon-btn" id="detail-snooze-btn" title="Snooze"><span class="material-symbols-outlined">snooze</span></button>
          <button class="icon-btn" id="detail-more-btn" title="More">
            <span class="material-symbols-outlined">more_vert</span>
          </button>
        </div>
      </div>
      <div class="detail-content" id="detail-content-area">
        <div class="detail-subject-title">
          ${em.subject}
          <button class="icon-btn" id="detail-star-btn" style="vertical-align:middle">
            <span class="material-symbols-outlined" style="color:${em.isStarred ? '#f9ab00' : 'inherit'}">${em.isStarred ? 'star' : 'star_border'}</span>
          </button>
        </div>
        <div id="thread-cards-area" style="margin-top:8px">
          <div style="text-align:center;padding:32px;color:var(--text-tertiary);font-size:13px">
            <span class="material-symbols-outlined" style="font-size:28px;display:block;margin-bottom:8px">hourglass_top</span>
            Loading conversation…
          </div>
        </div>
      </div>
    `;
  }

  private async renderThreadCards(em: Email, id: string, detailEl: HTMLElement) {
    // Try to get full thread from API; fall back to pseudo-thread from local state
    let messages: Email[] = [];
    try {
      const threadId = em.threadId || `subj_${em.subject.replace(/^(re|fwd|fw):\s*/gi,'').trim().toLowerCase()}`;
      const thread: Thread | null = await api.getThread(threadId);
      messages = thread ? (thread.messages as Email[]) : [];
    } catch {}

    // Fallback: group by subject match from local emails
    if (messages.length === 0) {
      const normSubject = (s: string) => s.replace(/^(re|fwd|fw):\s*/gi,'').trim().toLowerCase();
      const emNorm = normSubject(em.subject);
      messages = state.emails
        .filter(e => normSubject(e.subject) === emNorm && (e.folder === em.folder || e.folder === 'sent'))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      if (messages.length === 0) messages = [em];
    }

    const area = detailEl.querySelector<HTMLElement>('#thread-cards-area');
    if (!area) return;

    const threadCount = messages.length;
    area.innerHTML = `
      <div class="conversation-thread-container" id="thread-messages">
        ${messages.map((msg, idx) => this.buildThreadCard(msg, idx, threadCount, id)).join('')}
      </div>
      <div class="inline-reply-card" id="inline-reply-card" style="margin-top:16px">
        <div class="inline-reply-header">
          <span class="material-symbols-outlined" style="font-size:15px;vertical-align:middle;margin-right:4px">reply</span>
          Reply to ${em.fromName}
        </div>
        <div id="inline-reply-body" contenteditable="true" role="textbox" aria-multiline="true"
             aria-label="Reply body" placeholder="Write a reply…"></div>
        <div class="inline-reply-footer">
          <div style="display:flex;gap:8px">
            <button class="detail-reply-btn" id="inline-send-btn">
              <span class="material-symbols-outlined">send</span> Send
            </button>
            <button class="icon-btn" id="inline-compose-btn" title="Open in full compose">
              <span class="material-symbols-outlined">open_in_full</span>
            </button>
          </div>
          <button class="icon-btn" id="inline-discard-btn" title="Discard">
            <span class="material-symbols-outlined">delete_outline</span>
          </button>
        </div>
      </div>
    `;

    // Wire thread card expand/collapse
    area.querySelectorAll<HTMLElement>('.thread-card-header').forEach(header => {
      header.addEventListener('click', () => {
        const card = header.closest<HTMLElement>('.thread-message-card')!;
        const wasExpanded = card.classList.contains('expanded');
        // Collapse all
        area.querySelectorAll('.thread-message-card').forEach(c => c.classList.remove('expanded'));
        // Toggle clicked
        if (!wasExpanded) card.classList.add('expanded');
      });
    });

    // Wire attachment downloads inside thread cards
    area.querySelectorAll<HTMLElement>('.thread-att-dl-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const card = btn.closest<HTMLElement>('[data-att-name]')!;
        const name = card.dataset['attName'] ?? 'file';
        const blob = new Blob([`Toggle Mail – ${name}`], { type: 'application/octet-stream' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        URL.revokeObjectURL(a.href);
        showToast(`Downloading ${name}`, 'download');
      });
    });

    // Wire inline reply
    $('inline-send-btn')?.addEventListener('click', async () => {
      const bodyEl = $('inline-reply-body') as HTMLElement;
      const replyBody = bodyEl?.innerText?.trim();
      if (!replyBody) { showToast('Write something first!', 'warning'); return; }
      try {
        await state.sendEmail(
          em.fromEmail,
          em.subject.match(/^re:/i) ? em.subject : `Re: ${em.subject}`,
          `<p>${replyBody.replace(/\n/g, '<br>')}</p>`,
        );
        bodyEl.innerText = '';
        showToast('Reply sent!', 'send');
        sounds.receive();
      } catch {
        showToast('Failed to send reply', 'error');
      }
    });

    $('inline-compose-btn')?.addEventListener('click', () => compose.reply(id));
    $('inline-discard-btn')?.addEventListener('click', () => {
      const bodyEl = $('inline-reply-body') as HTMLElement;
      if (bodyEl) bodyEl.innerText = '';
      showToast('Draft discarded', 'delete_outline');
    });
  }

  private buildThreadCard(em: Email, idx: number, total: number, activeId: string): string {
    const isLast = idx === total - 1;
    // Expand the last (most recent) message and the currently selected one
    const expanded = isLast || em.id === activeId;
    const avatarBg = this.avatarColor(em.fromAvatar || em.fromName);
    const avatarLetter = (em.fromAvatar || em.fromName || '?')[0].toUpperCase();
    const dateStr = new Date(em.date).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });

    const attHtml = em.attachments?.length > 0 ? `
      <div style="margin-top:16px;border-top:1px solid var(--border-subtle);padding-top:14px">
        <div class="detail-att-title">Attachments (${em.attachments.length})</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px">
          ${em.attachments.map(a => `
            <div class="detail-att-card" data-att-name="${a.name}">
              <div class="att-card-icon">
                <span class="material-symbols-outlined">${a.type?.includes('pdf') ? 'picture_as_pdf' : 'insert_drive_file'}</span>
              </div>
              <div class="att-card-info">
                <div class="att-card-name">${a.name}</div>
                <div class="att-card-size">${a.size}</div>
              </div>
              <button class="att-card-dl-btn thread-att-dl-btn" title="Download">
                <span class="material-symbols-outlined">download</span>
              </button>
            </div>`).join('')}
        </div>
      </div>` : '';

    return `
      <div class="thread-message-card ${expanded ? 'expanded' : ''}" data-msg-id="${em.id}">
        <div class="thread-card-header">
          <div class="thread-header-left">
            <div class="thread-avatar" style="background:${avatarBg}">${avatarLetter}</div>
            <div>
              <div class="thread-from-name">${em.fromName}
                <span style="font-weight:400;font-size:12px;color:var(--text-tertiary);margin-left:4px">&lt;${em.fromEmail}&gt;</span>
              </div>
              ${!expanded ? `<div class="thread-snippet-preview">${em.snippet}</div>` : ''}
            </div>
          </div>
          <div class="thread-header-right">
            ${em.attachments?.length > 0 ? `<span class="material-symbols-outlined" style="font-size:16px;color:var(--text-tertiary)">attach_file</span>` : ''}
            ${em.isStarred ? `<span class="material-symbols-outlined" style="font-size:16px;color:#f9ab00">star</span>` : ''}
            <span class="thread-date-chip">${dateStr}</span>
            <span class="material-symbols-outlined thread-expand-icon">expand_more</span>
          </div>
        </div>
        <div class="thread-card-body">
          <div class="thread-card-meta">
            <span>to ${em.to || 'me'}</span>
            <span>•</span>
            <span>${dateStr}</span>
            ${!em.isRead ? `<span style="background:var(--color-primary);color:white;font-size:10px;font-weight:700;padding:1px 6px;border-radius:8px">UNREAD</span>` : ''}
          </div>
          <div class="thread-body-content">${em.body}</div>
          ${attHtml}
        </div>
      </div>`;
  }

  private wireDetailToolbar(em: Email, id: string, detailEl: HTMLElement) {
    $('detail-back-btn')?.addEventListener('click', () => { state.closeEmail(); sounds.click(); });
    $('detail-archive-btn')?.addEventListener('click', () => { state.archiveEmail(id); sounds.archive(); showToast('Archived', 'archive', true); });
    $('detail-delete-btn')?.addEventListener('click', () => { state.deleteEmail(id); sounds.trash(); showToast(i18n.t('movedToTrash'), 'delete', true); });
    $('detail-spam-btn')?.addEventListener('click', () => { state.moveEmail(id, 'spam'); showToast('Marked as spam', 'report'); });
    $('detail-unread-btn')?.addEventListener('click', () => { state.toggleRead(id); state.closeEmail(); });
    $('detail-snooze-btn')?.addEventListener('click', () => this.showSnoozeMenu(id));
    $('detail-star-btn')?.addEventListener('click', () => { state.toggleStar(id); sounds.star(); this.renderEmailDetail(id); });
    $('detail-more-btn')?.addEventListener('click', () => this.showMoreMenu(id, 'detail-more-btn'));
  }

  // ─── Menus & Popups ───────────────────────────────────────────────────────
  private showSnoozeMenu(id: string) {
    this.closeDropdowns();
    const opts = [
      { label: 'Later today (3 hours)', hours: 3 },
      { label: 'Tonight (8 PM)',         hours: 8 },
      { label: 'Tomorrow morning',       hours: 24 },
      { label: 'Next week',              hours: 168 },
    ];
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu snooze-menu';
    menu.innerHTML = opts.map(o =>
      `<button class="dropdown-item" data-hours="${o.hours}">
        <span class="material-symbols-outlined">snooze</span>${o.label}
      </button>`
    ).join('');
    document.body.appendChild(menu);
    const btn = $('detail-snooze-btn') ?? document.body;
    const rect = btn.getBoundingClientRect();
    menu.style.cssText = `top:${rect.bottom + 8}px;left:${rect.left}px`;

    menu.querySelectorAll<HTMLElement>('[data-hours]').forEach(item => {
      item.addEventListener('click', () => {
        const until = new Date(Date.now() + parseInt(item.dataset['hours']!) * 3_600_000).toISOString();
        state.snoozeEmail(id, until);
        menu.remove();
        showToast('Snoozed', 'snooze');
      });
    });
    setTimeout(() => document.addEventListener('click', this.closeDropdowns.bind(this), { once: true }), 10);
  }

  private showMoreMenu(id: string, triggerId: string) {
    this.closeDropdowns();
    const actions = [
      { label: 'Mark as read', icon: 'mark_email_read', action: () => state.toggleRead(id) },
      { label: 'Move to…', icon: 'drive_file_move', action: () => this.showMoveMenu(id) },
      { label: 'Add label…', icon: 'label', action: () => this.showLabelMenu(id) },
      { label: 'Print', icon: 'print', action: () => window.print() },
    ];
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu.innerHTML = actions.map(a =>
      `<button class="dropdown-item">
        <span class="material-symbols-outlined">${a.icon}</span>${a.label}
      </button>`
    ).join('');
    document.body.appendChild(menu);
    const btn = $(triggerId) ?? document.body;
    const r = btn.getBoundingClientRect();
    menu.style.cssText = `top:${r.bottom + 8}px;right:${window.innerWidth - r.right}px`;
    menu.querySelectorAll<HTMLElement>('.dropdown-item').forEach((item, i) => {
      item.addEventListener('click', () => { actions[i].action(); menu.remove(); });
    });
    setTimeout(() => document.addEventListener('click', this.closeDropdowns.bind(this), { once: true }), 10);
  }

  private showMoveMenu(id: string) {
    const folders: Array<{ key: Email['folder']; label: string }> = [
      { key: 'inbox',   label: 'Inbox'   }, { key: 'archive', label: 'Archive' },
      { key: 'spam',    label: 'Spam'    }, { key: 'trash',   label: 'Trash'   },
    ];
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu.innerHTML = folders.map(f => `<button class="dropdown-item" data-folder="${f.key}">${f.label}</button>`).join('');
    document.body.appendChild(menu);
    menu.style.cssText = 'top:50%;left:50%;transform:translate(-50%,-50%)';
    menu.querySelectorAll<HTMLElement>('[data-folder]').forEach(item => {
      item.addEventListener('click', () => {
        state.moveEmail(id, item.dataset['folder'] as Email['folder']);
        menu.remove();
        state.closeEmail();
      });
    });
    setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 10);
  }

  private showLabelMenu(id: string) {
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu.innerHTML = state.labels.map(l =>
      `<button class="dropdown-item" data-label="${l.name}">
        <span class="sidebar-label-dot" style="background:${l.color}"></span>${l.name}
      </button>`
    ).join('');
    document.body.appendChild(menu);
    menu.style.cssText = 'top:50%;left:50%;transform:translate(-50%,-50%)';
    menu.querySelectorAll<HTMLElement>('[data-label]').forEach(item => {
      item.addEventListener('click', () => {
        state.addLabel(id, item.dataset['label']!);
        menu.remove();
        showToast('Label added', 'label');
      });
    });
    setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 10);
  }

  private closeDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.remove());
  }

  // ─── Theme icon ───────────────────────────────────────────────────────────
  private updateThemeIcon() {
    const icon = $('theme-icon');
    if (!icon) return;
    const map: Record<Theme, string> = { light: 'light_mode', dark: 'dark_mode', emerald: 'eco', slate: 'gradient' };
    icon.textContent = map[state.theme] ?? 'light_mode';
  }

  // ─── Side Panel (Companion Rail) ──────────────────────────────────────────
  private renderSidePanel(type: string | null = this.activeSidePanel) {
    const panel = $('side-panel-content');
    if (!panel) return;
    if (!type) { panel.innerHTML = ''; return; }

    if (type === 'prayer') {
      const city = 'Islamabad';
      const times = PAKISTAN_PRAYER_TIMES[city];
      panel.innerHTML = `
        <div class="side-panel-header">
          <span class="material-symbols-outlined" style="color:#0b6623">mosque</span>
          <h3>Prayer Times – ${city}</h3>
        </div>
        <div class="prayer-times-grid">
          ${Object.entries(times).map(([name, time]) => `
            <div class="prayer-item">
              <span class="prayer-name">${name}</span>
              <span class="prayer-time">${time}</span>
            </div>`).join('')}
        </div>
        <p style="font-size:12px;color:var(--text-tertiary);margin-top:12px;text-align:center">🕌 Islamabad, Pakistan</p>`;
    }

    if (type === 'calendar') {
      const now = new Date();
      panel.innerHTML = `
        <div class="side-panel-header">
          <span class="material-symbols-outlined" style="color:#1a73e8">calendar_month</span>
          <h3>${now.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}</h3>
        </div>
        <div class="mini-calendar" id="mini-cal"></div>
        <div class="calendar-holidays">
          <h4 style="margin:12px 0 8px;font-size:13px;font-weight:600;color:var(--text-primary)">🇵🇰 Pakistani Holidays</h4>
          ${state.holidays.map(h => `
            <div class="holiday-item">
              <span class="holiday-dot"></span>
              <div><div class="holiday-title">${h.title}</div><div class="holiday-date">${h.date}</div></div>
            </div>`).join('')}
        </div>`;
      this.buildMiniCalendar();
    }

    if (type === 'tasks') {
      panel.innerHTML = `
        <div class="side-panel-header">
          <span class="material-symbols-outlined" style="color:#1a73e8">task_alt</span>
          <h3>Toggle Tasks</h3>
        </div>
        <div class="add-task-row">
          <input id="new-task-input" type="text" class="side-panel-input" placeholder="Add a task…">
          <button class="icon-btn" id="add-task-btn"><span class="material-symbols-outlined">add</span></button>
        </div>
        <div class="tasks-list">
          ${state.tasks.map(t => `
            <div class="task-item ${t.completed ? 'task-done' : ''}">
              <button class="icon-btn task-check-btn" data-id="${t.id}">
                <span class="material-symbols-outlined" style="font-size:20px;color:${t.completed ? 'var(--color-primary)' : 'var(--text-tertiary)'}">
                  ${t.completed ? 'task_alt' : 'radio_button_unchecked'}
                </span>
              </button>
              <div class="task-text-wrap">
                <span class="task-text">${t.text}</span>
                ${t.date ? `<span class="task-date">${t.date}</span>` : ''}
              </div>
              <button class="icon-btn task-del-btn" data-id="${t.id}">
                <span class="material-symbols-outlined" style="font-size:16px">close</span>
              </button>
            </div>`).join('')}
        </div>`;

      const addTask = () => {
        const input = el<HTMLInputElement>('new-task-input');
        if (input.value.trim()) { state.addTask(input.value.trim()); input.value = ''; }
      };
      $('add-task-btn')?.addEventListener('click', addTask);
      $('new-task-input')?.addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'Enter') addTask(); });
      panel.querySelectorAll<HTMLElement>('.task-check-btn').forEach(btn =>
        btn.addEventListener('click', () => state.toggleTask(btn.dataset['id']!)));
      panel.querySelectorAll<HTMLElement>('.task-del-btn').forEach(btn =>
        btn.addEventListener('click', () => state.deleteTask(btn.dataset['id']!)));
    }

    if (type === 'notes') {
      panel.innerHTML = `
        <div class="side-panel-header">
          <span class="material-symbols-outlined" style="color:#f9ab00">note_alt</span>
          <h3>Toggle Notes</h3>
        </div>
        <div class="add-note-form">
          <input id="note-title-input" type="text" class="side-panel-input" placeholder="Title">
          <textarea id="note-body-input" class="side-panel-textarea" placeholder="Note…" rows="3"></textarea>
          <button class="side-panel-btn" id="save-note-btn">
            <span class="material-symbols-outlined">save</span> Save Note
          </button>
        </div>
        <div class="notes-list">
          ${state.notes.map(n => `
            <div class="note-card">
              <div class="note-card-header">
                <span class="note-card-title">${n.title}</span>
                <button class="icon-btn note-del-btn" data-id="${n.id}"><span class="material-symbols-outlined" style="font-size:16px">delete_outline</span></button>
              </div>
              <p class="note-card-content">${n.content}</p>
              <span class="note-updated">${n.updatedAt}</span>
            </div>`).join('')}
        </div>`;

      $('save-note-btn')?.addEventListener('click', () => {
        const title = el<HTMLInputElement>('note-title-input').value.trim();
        const content = el<HTMLTextAreaElement>('note-body-input').value.trim();
        if (title || content) {
          state.addNote(title || 'Untitled', content);
          el<HTMLInputElement>('note-title-input').value = '';
          el<HTMLTextAreaElement>('note-body-input').value = '';
        }
      });
      panel.querySelectorAll<HTMLElement>('.note-del-btn').forEach(btn =>
        btn.addEventListener('click', () => state.deleteNote(btn.dataset['id']!)));
    }

    if (type === 'contacts') {
      panel.innerHTML = `
        <div class="side-panel-header">
          <span class="material-symbols-outlined" style="color:#ea4335">contacts</span>
          <h3>Contacts</h3>
        </div>
        <div class="add-contact-form">
          <input id="contact-name" type="text" class="side-panel-input" placeholder="Full Name">
          <input id="contact-email" type="email" class="side-panel-input" placeholder="Email">
          <input id="contact-phone" type="tel" class="side-panel-input" placeholder="Phone (+92…)">
          <button class="side-panel-btn" id="save-contact-btn">
            <span class="material-symbols-outlined">person_add</span> Add Contact
          </button>
        </div>
        <div class="contacts-list">
          ${state.contacts.map(c => `
            <div class="contact-card" data-email="${c.email}">
              <div class="email-avatar" style="background:${this.avatarColor(c.name)};width:36px;height:36px;font-size:14px;flex-shrink:0">${c.name[0]}</div>
              <div class="contact-info">
                <div class="contact-name">${c.name}</div>
                <div class="contact-email">${c.email}</div>
                <div class="contact-role">${c.role}</div>
              </div>
              <button class="icon-btn" title="Compose to ${c.name}">
                <span class="material-symbols-outlined" style="font-size:18px">edit</span>
              </button>
            </div>`).join('')}
        </div>`;

      $('save-contact-btn')?.addEventListener('click', () => {
        const name  = el<HTMLInputElement>('contact-name').value.trim();
        const email = el<HTMLInputElement>('contact-email').value.trim();
        const phone = el<HTMLInputElement>('contact-phone').value.trim();
        if (name && email) {
          state.addContact(name, email, phone);
          el<HTMLInputElement>('contact-name').value = '';
          el<HTMLInputElement>('contact-email').value = '';
          el<HTMLInputElement>('contact-phone').value = '';
          showToast(`${name} added`, 'person_add');
        }
      });
      panel.querySelectorAll<HTMLElement>('.contact-card button').forEach((btn, i) => {
        const card = panel.querySelectorAll<HTMLElement>('.contact-card')[i];
        btn.addEventListener('click', () => compose.open({ to: card?.dataset['email'] }));
      });
    }
  }

  private buildMiniCalendar() {
    const container = $('mini-cal');
    if (!container) return;
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const days = ['Su','Mo','Tu','We','Th','Fr','Sa'];
    let html = `<div class="mini-cal-grid">${days.map(d => `<div class="mini-cal-day-name">${d}</div>`).join('')}`;
    for (let i = 0; i < firstDay; i++) html += `<div></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === now.getDate();
      html += `<div class="mini-cal-cell ${isToday ? 'mini-cal-today' : ''}">${d}</div>`;
    }
    html += '</div>';
    container.innerHTML = html;
  }

  // ─── Settings Modal ───────────────────────────────────────────────────────
  private showSettingsModal() {
    const existing = $('settings-modal');
    if (existing) { existing.remove(); return; }
    const modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-dialog settings-dialog">
        <div class="modal-header">
          <h2 class="modal-title"><span class="material-symbols-outlined">settings</span> Settings</h2>
          <button class="icon-btn" id="settings-close"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="modal-body settings-body">
          <div class="settings-section">
            <h3 class="settings-section-title">Appearance</h3>
            <div class="settings-row">
              <label class="settings-label">Theme</label>
              <div class="theme-swatches">
                ${(['light','dark','emerald','slate'] as Theme[]).map(t => `
                  <button class="theme-swatch theme-swatch-${t} ${state.theme === t ? 'active' : ''}" data-theme="${t}" title="${t}">
                    ${state.theme === t ? '<span class="material-symbols-outlined" style="font-size:16px">check</span>' : ''}
                  </button>`).join('')}
              </div>
            </div>
            <div class="settings-row">
              <label class="settings-label">Density</label>
              <div class="density-options">
                ${(['comfortable','compact'] as const).map(d => `
                  <label class="density-option ${state.density === d ? 'active' : ''}">
                    <input type="radio" name="density" value="${d}" ${state.density === d ? 'checked' : ''}> ${d.charAt(0).toUpperCase() + d.slice(1)}
                  </label>`).join('')}
              </div>
            </div>
          </div>
          <div class="settings-section">
            <h3 class="settings-section-title">Language</h3>
            <div class="settings-row">
              <button class="settings-lang-btn ${state.lang === 'en' ? 'active' : ''}" data-lang="en">🇬🇧 English</button>
              <button class="settings-lang-btn ${state.lang === 'ur' ? 'active' : ''}" data-lang="ur">🇵🇰 اردو</button>
            </div>
          </div>
          <div class="settings-section">
            <h3 class="settings-section-title">Sound</h3>
            <div class="settings-row">
              <label class="settings-label">Notification sounds</label>
              <label class="toggle-switch">
                <input type="checkbox" id="sounds-toggle" ${sounds.isEnabled() ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          <div class="settings-section">
            <h3 class="settings-section-title">Labels</h3>
            <div class="add-label-row">
              <input id="new-label-name" type="text" class="side-panel-input" placeholder="New label name" style="flex:1">
              <button class="icon-btn" id="add-label-btn"><span class="material-symbols-outlined">add</span></button>
            </div>
          </div>
        </div>
      </div>`;

    document.body.appendChild(modal);

    modal.querySelectorAll<HTMLElement>('[data-theme]').forEach(btn => {
      btn.addEventListener('click', () => { state.setTheme(btn.dataset['theme'] as Theme); this.updateThemeIcon(); modal.remove(); });
    });
    modal.querySelectorAll<HTMLInputElement>('input[name="density"]').forEach(radio => {
      radio.addEventListener('change', () => state.setDensity(radio.value as any));
    });
    modal.querySelectorAll<HTMLElement>('[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => { i18n.setLang(btn.dataset['lang'] as any); state.lang = btn.dataset['lang'] as any; });
    });
    $('sounds-toggle')?.addEventListener('change', () => sounds.toggle());
    $('settings-close')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    $('add-label-btn')?.addEventListener('click', () => {
      const input = el<HTMLInputElement>('new-label-name');
      if (input.value.trim()) { state.createLabel(input.value.trim()); input.value = ''; showToast('Label created', 'label'); }
    });
  }

  // ─── Keyboard Shortcuts ───────────────────────────────────────────────────
  private showKeyboardShortcuts() {
    const existing = $('shortcuts-modal');
    if (existing) { existing.remove(); return; }
    const shortcuts = [
      ['c', 'Compose new email'], ['/', 'Focus search'], ['?', 'Show keyboard shortcuts'],
      ['e', 'Archive selected'], ['#', 'Delete selected'], ['r', 'Reply'],
      ['f', 'Forward'], ['u', 'Back to inbox'], ['s', 'Toggle star'],
      ['m', 'Mute conversation'], ['!', 'Report spam'], ['Ctrl+Z', 'Undo'],
      ['j', 'Next email'], ['k', 'Previous email'],
    ];
    const modal = document.createElement('div');
    modal.id = 'shortcuts-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h2 class="modal-title"><span class="material-symbols-outlined">keyboard</span> Keyboard Shortcuts</h2>
          <button class="icon-btn" id="shortcuts-close"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="modal-body">
          <div class="shortcuts-grid">
            ${shortcuts.map(([k, desc]) => `
              <div class="shortcut-row">
                <kbd class="kbd">${k}</kbd>
                <span class="shortcut-desc">${desc}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    $('shortcuts-close')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  }

  // ─── Profile Menu ─────────────────────────────────────────────────────────
  private async showProfileMenu() {
    const existing = $('profile-menu');
    if (existing) { existing.remove(); return; }

    // Resolve the real Toggle Account session (falls back to signed-out view).
    let session: { signed_in: boolean; user?: { email: string }; auth_service?: string } | null = null;
    try {
      const res = await fetch('/auth/me', { credentials: 'same-origin' });
      session = await res.json();
    } catch { /* signed-out / offline */ }

    const email = session?.signed_in && session.user ? session.user.email : '';
    const localPart = email ? email.split('@')[0] : '';
    const displayName = localPart
      ? localPart.replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'Guest';
    const initials = email
      ? email.substring(0, 2).toUpperCase()
      : '?';
    const authBase = session?.auth_service || 'http://localhost:4000';

    const menu = document.createElement('div');
    menu.id = 'profile-menu';
    menu.className = 'profile-dropdown';
    menu.innerHTML = `
      <div class="profile-dropdown-header">
        <div class="profile-avatar-lg">${initials}</div>
        <div>
          <div class="profile-name-lg">${displayName}</div>
          <div class="profile-email-sm">${email || 'Not signed in'}</div>
        </div>
      </div>
      <hr class="profile-divider">
      <button class="dropdown-item" id="pmenu-manage">
        <span class="material-symbols-outlined">manage_accounts</span> Manage Account
      </button>
      <button class="dropdown-item" id="pmenu-add">
        <span class="material-symbols-outlined">person_add</span> Add another account
      </button>
      <hr class="profile-divider">
      <button class="dropdown-item" id="pmenu-signout">
        <span class="material-symbols-outlined">logout</span> ${email ? 'Sign out' : 'Sign in with Toggle Account'}
      </button>`;
    document.body.appendChild(menu);
    const btn = $('profile-btn');
    if (btn) {
      const r = btn.getBoundingClientRect();
      menu.style.cssText = `top:${r.bottom + 8}px;right:${window.innerWidth - r.right}px`;
    }
    $('pmenu-manage')?.addEventListener('click', () => {
      window.open(email ? `${authBase}/account` : `${authBase}/signup`, '_blank');
      menu.remove();
    });
    $('pmenu-add')?.addEventListener('click', () => { showToast('Add account feature coming soon!', 'person_add'); menu.remove(); });
    $('pmenu-signout')?.addEventListener('click', () => {
      window.location.href = email ? '/auth/logout' : '/auth/login';
    });
    setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 10);
  }

  // ─── App Grid (Google Apps) ───────────────────────────────────────────────
  private showAppGrid() {
    const existing = $('app-grid-menu');
    if (existing) { existing.remove(); return; }
    const menu = document.createElement('div');
    menu.id = 'app-grid-menu';
    menu.className = 'app-grid-dropdown';
    menu.innerHTML = `
      <div class="app-grid-title">Toggle Suite</div>
      <div class="app-grid" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 16px;color:var(--text-tertiary);text-align:center;gap:10px;min-height:120px">
        <span class="material-symbols-outlined" style="font-size:36px;opacity:0.35">apps</span>
        <div style="font-size:13px;font-weight:500;color:var(--text-secondary)">No apps configured yet</div>
        <div style="font-size:11px;color:var(--text-tertiary)">Apps will appear here</div>
      </div>`;
    document.body.appendChild(menu);
    const btn = $('app-grid-btn');
    if (btn) {
      const r = btn.getBoundingClientRect();
      menu.style.cssText = `top:${r.bottom + 8}px;right:${window.innerWidth - r.right}px;width:260px;`;
    }
    setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 10);
  }

  private toggleSidePanel(type: string) {
    const panel = $('side-panel');
    if (this.activeSidePanel === type) {
      this.activeSidePanel = null;
      if (panel) panel.style.display = 'none';
    } else {
      this.activeSidePanel = type;
      if (panel) panel.style.display = 'flex';
      this.renderSidePanel(type);
    }
    // Update rail active state
    document.querySelectorAll<HTMLElement>('.rail-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset['panel'] === this.activeSidePanel);
    });
  }

  // ─── Select all dropdown ──────────────────────────────────────────────────
  private showSelectDropdown() {
    this.closeDropdowns();
    const opts = [
      { label: 'All', action: () => state.selectAll() },
      { label: 'None', action: () => state.selectNone() },
      { label: 'Read', action: () => state.selectRead() },
      { label: 'Unread', action: () => state.selectUnread() },
      { label: 'Starred', action: () => state.selectStarred() },
    ];
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu';
    menu.innerHTML = opts.map(o => `<button class="dropdown-item">${o.label}</button>`).join('');
    const btn = $('select-all-btn');
    if (btn) {
      const r = btn.getBoundingClientRect();
      menu.style.cssText = `top:${r.bottom + 4}px;left:${r.left}px`;
    }
    document.body.appendChild(menu);
    menu.querySelectorAll<HTMLElement>('.dropdown-item').forEach((item, i) => {
      item.addEventListener('click', () => { opts[i].action(); menu.remove(); });
    });
    setTimeout(() => document.addEventListener('click', this.closeDropdowns.bind(this), { once: true }), 10);
  }

  // ─── Bind All DOM Events ──────────────────────────────────────────────────
  private bindAll() {
    // Hamburger / sidebar toggle
    $('hamburger-btn')?.addEventListener('click', () => {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      const sidebar = $('app-sidebar') || $('sidebar');
      if (sidebar) sidebar.classList.toggle('collapsed', this.sidebarCollapsed);
    });

    // Compose button
    const composeBtn = $('sidebar-compose-btn') || $('compose-btn');
    composeBtn?.addEventListener('click', () => compose.open());

    // Theme toggle (cycles: light → dark → emerald → slate → light)
    $('theme-toggle-btn')?.addEventListener('click', () => {
      const cycle: Theme[] = ['light', 'dark', 'emerald', 'slate'];
      const next = cycle[(cycle.indexOf(state.theme) + 1) % cycle.length];
      state.setTheme(next);
      sounds.click();
    });

    // Search
    const searchInput = el<HTMLInputElement>('search-input');
    searchInput?.addEventListener('input', () => state.setSearch(searchInput.value));
    searchInput?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') { state.setSearch(''); searchInput.value = ''; searchInput.blur(); }
    });
    $('search-clear-btn')?.addEventListener('click', () => {
      state.setSearch(''); searchInput.value = '';
    });
    $('search-form')?.addEventListener('submit', (e: Event) => e.preventDefault());

    // Toolbar buttons
    $('refresh-btn')?.addEventListener('click', () => { state.notify(); showToast('Refreshed', 'refresh'); sounds.receive(); });
    $('select-all-btn')?.addEventListener('click', () => this.showSelectDropdown());
    $('settings-btn')?.addEventListener('click', () => this.showSettingsModal());
    $('help-btn')?.addEventListener('click', () => this.showKeyboardShortcuts());
    $('profile-btn')?.addEventListener('click', () => this.showProfileMenu());
    $('app-grid-btn')?.addEventListener('click', () => this.showAppGrid());

    // Bulk action bar
    $('bulk-archive-btn')?.addEventListener('click', () => { state.bulkArchive(); sounds.archive(); showToast('Archived', 'archive', true); });
    $('bulk-delete-btn')?.addEventListener('click', () => { state.bulkDelete(); sounds.trash(); showToast('Moved to Trash', 'delete', true); });
    $('bulk-read-btn')?.addEventListener('click', () => { state.bulkMarkRead(); showToast('Marked as read', 'mark_email_read'); });
    $('bulk-deselect-btn')?.addEventListener('click', () => state.selectNone());

    // Companion rail buttons
    document.querySelectorAll<HTMLElement>('.rail-btn').forEach(btn => {
      btn.addEventListener('click', () => this.toggleSidePanel(btn.dataset['panel']!));
    });

    // Lang toggle in header
    $('lang-toggle-btn')?.addEventListener('click', () => { i18n.toggle(); sounds.click(); });

    // Mark all read
    $('mark-all-read-btn')?.addEventListener('click', () => { state.markAllRead(); showToast('All marked as read', 'mark_email_read'); });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (!inInput) {
        if (e.key === 'c') { compose.open(); return; }
        if (e.key === '/') { e.preventDefault(); searchInput?.focus(); return; }
        if (e.key === '?') { this.showKeyboardShortcuts(); return; }
        if (e.key === 'u') { state.closeEmail(); return; }
        if (state.selectedEmailId) {
          if (e.key === 'e') { state.archiveEmail(state.selectedEmailId); sounds.archive(); showToast('Archived', 'archive', true); }
          if (e.key === '#') { state.deleteEmail(state.selectedEmailId); sounds.trash(); showToast(i18n.t('movedToTrash'), 'delete', true); }
          if (e.key === 'r') { compose.reply(state.selectedEmailId); }
          if (e.key === 'f') { compose.forward(state.selectedEmailId); }
          if (e.key === 's') { state.toggleStar(state.selectedEmailId); sounds.star(); }
          if (e.key === '!') { state.moveEmail(state.selectedEmailId, 'spam'); showToast('Marked as spam', 'report'); state.closeEmail(); }
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { state.undo(); showToast('Undone', 'undo'); }
    });

    // Click outside dropdowns
    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-menu') && !target.closest('[id$="-btn"]')) return;
    });
  }
}

export const uiController = new UIController();
