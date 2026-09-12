import { state } from './state';
import { sounds } from './sound';
import { i18n } from './localization';
import { URDU_PHRASES } from './localization';
import { api } from './api-client';

class ComposeManager {
  private el: HTMLElement | null = null;
  private maximized = false;
  private toVal   = '';
  private ccVal   = '';
  private bccVal  = '';
  private subjVal = '';
  private bodyVal = '';
  private attachments: Array<{ name: string; size: string; type: string; downloadUrl?: string }> = [];

  open(prefill: { to?: string; subject?: string; body?: string } = {}) {
    this.toVal   = prefill.to      ?? '';
    this.subjVal = prefill.subject ?? '';
    this.bodyVal = prefill.body    ?? '';
    this.attachments = [];
    this.render();
  }

  reply(emailId: string) {
    const em = state.emails.find(e => e.id === emailId);
    if (!em) return;
    this.open({
      to: em.fromEmail,
      subject: em.subject.startsWith('Re:') ? em.subject : `Re: ${em.subject}`,
      body: `<br><br><p style="color:#5f6368;border-left:3px solid #dadce0;padding-left:12px;margin:8px 0">
        <strong>On ${new Date(em.date).toLocaleDateString('en-PK')}, ${em.fromName} wrote:</strong><br>
        ${em.body}
      </p>`,
    });
  }

  forward(emailId: string) {
    const em = state.emails.find(e => e.id === emailId);
    if (!em) return;
    this.open({
      subject: em.subject.startsWith('Fwd:') ? em.subject : `Fwd: ${em.subject}`,
      body: `<br><br><p style="color:#5f6368;border-left:3px solid #dadce0;padding-left:12px;margin:8px 0">
        <strong>---------- Forwarded message ----------</strong><br>
        From: ${em.from}<br>To: ${em.to}<br>Date: ${em.date}<br>Subject: ${em.subject}<br><br>
        ${em.body}
      </p>`,
    });
  }

  close() {
    this.el?.remove();
    this.el = null;
    this.maximized = false;
    this.attachments = [];
  }

  toggleMaximize() {
    this.maximized = !this.maximized;
    if (this.el) {
      this.el.classList.toggle('compose-maximized', this.maximized);
      const icon = this.el.querySelector<HTMLElement>('#compose-maximize-icon');
      if (icon) icon.textContent = this.maximized ? 'close_fullscreen' : 'open_in_full';
    }
  }

  private render() {
    this.el?.remove();

    const wrap = document.createElement('div');
    wrap.id = 'compose-window';
    wrap.className = 'compose-window';
    wrap.innerHTML = `
      <div class="compose-header" id="compose-drag-handle">
        <span class="compose-title">New Message</span>
        <div class="compose-header-actions">
          <button class="icon-btn compose-ctrl-btn" id="compose-minimize-btn" title="Minimize">
            <span class="material-symbols-outlined">remove</span>
          </button>
          <button class="icon-btn compose-ctrl-btn" id="compose-maximize-btn" title="Maximize">
            <span class="material-symbols-outlined" id="compose-maximize-icon">open_in_full</span>
          </button>
          <button class="icon-btn compose-ctrl-btn" id="compose-close-btn" title="Discard">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      <div class="compose-fields">
        <div class="compose-field-row">
          <label class="compose-field-label">To</label>
          <input id="compose-to" type="email" class="compose-field-input" placeholder="Recipients" value="${this.toVal}" multiple>
          <div class="compose-field-extra-btns">
            <button class="compose-cc-btn" id="compose-toggle-cc">Cc</button>
            <button class="compose-cc-btn" id="compose-toggle-bcc">Bcc</button>
          </div>
        </div>
        <div class="compose-field-row" id="compose-cc-row" style="display:none">
          <label class="compose-field-label">Cc</label>
          <input id="compose-cc" type="email" class="compose-field-input" placeholder="Cc" value="${this.ccVal}" multiple>
        </div>
        <div class="compose-field-row" id="compose-bcc-row" style="display:none">
          <label class="compose-field-label">Bcc</label>
          <input id="compose-bcc" type="email" class="compose-field-input" placeholder="Bcc" value="${this.bccVal}" multiple>
        </div>
        <div class="compose-field-row">
          <input id="compose-subject" type="text" class="compose-field-input compose-subject-input" placeholder="Subject" value="${this.subjVal}">
        </div>
      </div>

      <!-- WYSIWYG Formatting Toolbar -->
      <div id="compose-wysiwyg-bar" style="display:none;padding:6px 12px;background:var(--bg-surface-variant);border-bottom:1px solid var(--border-subtle);display:flex;align-items:center;gap:4px;flex-wrap:wrap">
        <button type="button" class="icon-btn" data-cmd="bold" title="Bold (Ctrl+B)" style="width:30px;height:30px"><span class="material-symbols-outlined" style="font-size:18px">format_bold</span></button>
        <button type="button" class="icon-btn" data-cmd="italic" title="Italic (Ctrl+I)" style="width:30px;height:30px"><span class="material-symbols-outlined" style="font-size:18px">format_italic</span></button>
        <button type="button" class="icon-btn" data-cmd="underline" title="Underline (Ctrl+U)" style="width:30px;height:30px"><span class="material-symbols-outlined" style="font-size:18px">format_underlined</span></button>
        <button type="button" class="icon-btn" data-cmd="strikeThrough" title="Strikethrough" style="width:30px;height:30px"><span class="material-symbols-outlined" style="font-size:18px">strikethrough_s</span></button>
        <div style="width:1px;height:18px;background:var(--border-color);margin:0 4px"></div>
        <button type="button" class="icon-btn" data-cmd="insertUnorderedList" title="Bulleted list" style="width:30px;height:30px"><span class="material-symbols-outlined" style="font-size:18px">format_list_bulleted</span></button>
        <button type="button" class="icon-btn" data-cmd="insertOrderedList" title="Numbered list" style="width:30px;height:30px"><span class="material-symbols-outlined" style="font-size:18px">format_list_numbered</span></button>
        <button type="button" class="icon-btn" data-cmd="formatBlock" data-val="blockquote" title="Quote" style="width:30px;height:30px"><span class="material-symbols-outlined" style="font-size:18px">format_quote</span></button>
        <button type="button" class="icon-btn" data-cmd="removeFormat" title="Clear formatting" style="width:30px;height:30px"><span class="material-symbols-outlined" style="font-size:18px">format_clear</span></button>
      </div>

      <div id="compose-body" class="compose-body" contenteditable="true" dir="auto">${this.bodyVal || ''}</div>

      <!-- Attachment chips tray -->
      <div id="compose-attachments-tray" style="padding:6px 16px;display:flex;flex-wrap:wrap;gap:8px;border-top:1px solid var(--border-subtle)"></div>

      <div class="compose-urdu-toolbar" id="compose-urdu-bar" style="display:none">
        <span class="compose-urdu-label">Quick Phrases:</span>
        <div class="compose-urdu-chips" id="compose-urdu-chips"></div>
      </div>

      <div class="compose-toolbar">
        <button class="compose-send-btn" id="compose-send-btn">
          <span class="material-symbols-outlined">send</span> Send
        </button>
        <div class="compose-toolbar-icons">
          <button class="icon-btn" id="compose-format-btn" title="Toggle formatting toolbar">
            <span class="material-symbols-outlined">format_color_text</span>
          </button>
          <button class="icon-btn" id="compose-attach-btn" title="Attach files (or drag & drop)">
            <span class="material-symbols-outlined">attach_file</span>
          </button>
          <button class="icon-btn" id="compose-link-btn" title="Insert link">
            <span class="material-symbols-outlined">link</span>
          </button>
          <button class="icon-btn" id="compose-urdu-toggle-btn" title="Urdu Phrases">
            <span style="font-size:13px;font-weight:700;font-family:var(--font-urdu)">اردو</span>
          </button>
          <button class="icon-btn compose-delete-btn" id="compose-discard-btn" title="Discard draft">
            <span class="material-symbols-outlined">delete_outline</span>
          </button>
        </div>
      </div>
      <input type="file" id="compose-file-input" multiple style="display:none">
    `;

    document.body.appendChild(wrap);
    this.el = wrap;
    this.bindEvents(wrap);

    // Focus To field or body
    setTimeout(() => {
      const to = wrap.querySelector<HTMLInputElement>('#compose-to');
      if (!this.toVal && to) to.focus();
      else (wrap.querySelector<HTMLElement>('#compose-body'))?.focus();
    }, 50);
  }

  private renderAttachmentsTray(wrap: HTMLElement) {
    const tray = wrap.querySelector<HTMLElement>('#compose-attachments-tray');
    if (!tray) return;
    if (this.attachments.length === 0) {
      tray.style.display = 'none';
      return;
    }
    tray.style.display = 'flex';
    tray.innerHTML = this.attachments.map((a, idx) => `
      <div class="attachment-chip" style="display:inline-flex;align-items:center;gap:6px;background:var(--bg-surface-variant);border:1px solid var(--border-color);padding:4px 10px;border-radius:16px;font-size:12px;color:var(--text-primary)">
        <span class="material-symbols-outlined" style="font-size:16px;color:var(--color-primary)">description</span>
        <span><strong>${a.name}</strong> (${a.size})</span>
        <button type="button" class="icon-btn" data-remove-idx="${idx}" style="width:18px;height:18px;margin-left:4px;cursor:pointer">
          <span class="material-symbols-outlined" style="font-size:14px">close</span>
        </button>
      </div>
    `).join('');

    tray.querySelectorAll<HTMLElement>('[data-remove-idx]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset['removeIdx']!, 10);
        this.attachments.splice(idx, 1);
        this.renderAttachmentsTray(wrap);
      });
    });
  }

  private async handleFiles(files: FileList | File[], wrap: HTMLElement) {
    for (const file of Array.from(files)) {
      this.showToast(`Uploading ${file.name}…`, 'cloud_upload');
      const uploaded = await api.uploadAttachment(file);
      if (uploaded) {
        this.attachments.push({
          name: uploaded.name,
          size: uploaded.size,
          type: uploaded.type,
          downloadUrl: uploaded.downloadUrl,
        });
        this.renderAttachmentsTray(wrap);
      }
    }
    this.showToast('Attachments ready', 'check_circle');
  }

  private bindEvents(wrap: HTMLElement) {
    wrap.querySelector('#compose-close-btn')?.addEventListener('click', () => {
      const to   = wrap.querySelector<HTMLInputElement>('#compose-to')!.value;
      const subj = wrap.querySelector<HTMLInputElement>('#compose-subject')!.value;
      const body = wrap.querySelector<HTMLElement>('#compose-body')!.innerHTML;
      if (to || subj || body) state.saveDraft(to, subj, body);
      this.close();
    });

    wrap.querySelector('#compose-minimize-btn')?.addEventListener('click', () => {
      wrap.classList.toggle('compose-minimized');
    });

    wrap.querySelector('#compose-maximize-btn')?.addEventListener('click', () => this.toggleMaximize());

    wrap.querySelector('#compose-send-btn')?.addEventListener('click', () => {
      const to   = wrap.querySelector<HTMLInputElement>('#compose-to')!.value.trim();
      const subj = wrap.querySelector<HTMLInputElement>('#compose-subject')!.value.trim();
      const body = wrap.querySelector<HTMLElement>('#compose-body')!.innerHTML;
      const cc   = wrap.querySelector<HTMLInputElement>('#compose-cc')?.value ?? '';
      const bcc  = wrap.querySelector<HTMLInputElement>('#compose-bcc')?.value ?? '';
      if (!to) { wrap.querySelector<HTMLInputElement>('#compose-to')!.focus(); return; }
      state.sendEmail(to, subj || '(no subject)', body, cc, bcc, this.attachments);
      sounds.send();
      this.close();
      this.showToast(i18n.t('messageSent'), 'send');
    });

    wrap.querySelector('#compose-toggle-cc')?.addEventListener('click', () => {
      const row = wrap.querySelector<HTMLElement>('#compose-cc-row')!;
      row.style.display = row.style.display === 'none' ? 'flex' : 'none';
      wrap.querySelector<HTMLInputElement>('#compose-cc')?.focus();
    });

    wrap.querySelector('#compose-toggle-bcc')?.addEventListener('click', () => {
      const row = wrap.querySelector<HTMLElement>('#compose-bcc-row')!;
      row.style.display = row.style.display === 'none' ? 'flex' : 'none';
      wrap.querySelector<HTMLInputElement>('#compose-bcc')?.focus();
    });

    wrap.querySelector('#compose-discard-btn')?.addEventListener('click', () => this.close());

    // WYSIWYG Formatting Toggle & Commands
    wrap.querySelector('#compose-format-btn')?.addEventListener('click', () => {
      const bar = wrap.querySelector<HTMLElement>('#compose-wysiwyg-bar')!;
      bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
    });

    wrap.querySelectorAll<HTMLElement>('#compose-wysiwyg-bar [data-cmd]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset['cmd']!;
        const val = btn.dataset['val'] || undefined;
        document.execCommand(cmd, false, val);
        wrap.querySelector<HTMLElement>('#compose-body')?.focus();
      });
    });

    wrap.querySelector('#compose-link-btn')?.addEventListener('click', () => {
      const url = prompt('Enter URL:', 'https://');
      if (url) document.execCommand('createLink', false, url);
    });

    // File attachments & drag-drop
    const fileInput = wrap.querySelector<HTMLInputElement>('#compose-file-input')!;
    wrap.querySelector('#compose-attach-btn')?.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        this.handleFiles(fileInput.files, wrap);
      }
    });

    // Drag-and-Drop file handling on compose modal
    wrap.addEventListener('dragover', (e) => {
      e.preventDefault();
      wrap.style.boxShadow = '0 0 0 2px var(--color-google-blue)';
    });
    wrap.addEventListener('dragleave', () => {
      wrap.style.boxShadow = '';
    });
    wrap.addEventListener('drop', (e) => {
      e.preventDefault();
      wrap.style.boxShadow = '';
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        this.handleFiles(e.dataTransfer.files, wrap);
      }
    });

    wrap.querySelector('#compose-urdu-toggle-btn')?.addEventListener('click', () => {
      const bar = wrap.querySelector<HTMLElement>('#compose-urdu-bar')!;
      const isVisible = bar.style.display !== 'none';
      bar.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        const chips = wrap.querySelector<HTMLElement>('#compose-urdu-chips')!;
        chips.innerHTML = URDU_PHRASES.map(p =>
          `<button class="compose-urdu-chip" data-phrase="${p}">${p}</button>`
        ).join('');
        chips.querySelectorAll('.compose-urdu-chip').forEach(btn => {
          btn.addEventListener('click', () => {
            const body = wrap.querySelector<HTMLElement>('#compose-body')!;
            body.focus();
            document.execCommand('insertText', false, (btn as HTMLElement).dataset['phrase'] + ' ');
          });
        });
      }
    });

    // Drag
    const handle = wrap.querySelector<HTMLElement>('#compose-drag-handle')!;
    let ox = 0, oy = 0, dragging = false;
    handle.addEventListener('mousedown', e => {
      dragging = true;
      ox = e.clientX - wrap.offsetLeft;
      oy = e.clientY - wrap.offsetTop;
      wrap.style.transition = 'none';
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      wrap.style.left = `${e.clientX - ox}px`;
      wrap.style.top  = `${e.clientY - oy}px`;
      wrap.style.bottom = 'auto'; wrap.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => { dragging = false; wrap.style.transition = ''; });
  }

  private showToast(msg: string, icon = 'info') {
    const t = document.createElement('div');
    t.className = 'toast-notification';
    t.innerHTML = `<span class="material-symbols-outlined">${icon}</span><span>${msg}</span>`;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('toast-visible'), 10);
    setTimeout(() => { t.classList.remove('toast-visible'); setTimeout(() => t.remove(), 300); }, 3000);
  }
}

export const compose = new ComposeManager();
