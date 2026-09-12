// Toggle Mail – Localization & Bilingual Support (TypeScript)

import type { Lang } from './types';

export const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: {
    appName: 'Toggle Mail', sovereignBadge: 'Sovereign Cloud: Islamabad DC',
    searchPlaceholder: 'Search in mail (press / to focus)', compose: 'Compose',
    inbox: 'Inbox', starred: 'Starred', snoozed: 'Snoozed', sent: 'Sent',
    drafts: 'Drafts', important: 'Important', allMail: 'All Mail', spam: 'Spam', trash: 'Trash',
    categories: 'Categories', primary: 'Primary', promotions: 'Promotions',
    social: 'Social', updates: 'Updates', labels: 'Labels', addLabel: 'Create new label',
    storageUsed: '12.4 GB of 25 GB used', storageSubtext: 'Hosted in Pakistan',
    manageStorage: 'Manage Storage', selectAll: 'All', selectNone: 'None',
    refresh: 'Refresh', archive: 'Archive', reportSpam: 'Report spam', delete: 'Delete',
    markRead: 'Mark as read', markUnread: 'Mark as unread', snooze: 'Snooze',
    reply: 'Reply', forward: 'Forward', print: 'Print', send: 'Send',
    discardDraft: 'Discard draft', subject: 'Subject', to: 'To', cc: 'Cc', bcc: 'Bcc',
    settings: 'Settings', language: 'Language', theme: 'Theme',
    securityVerified: 'TLS Encrypted • Pakistan Sovereign PKI Verified',
    emptyInbox: 'Your primary inbox is clear and up to date.',
    messageSent: 'Message sent', movedToTrash: 'Conversation moved to Trash',
    savedDraft: 'Draft saved', undo: 'Undo',
  },
  ur: {
    appName: 'ٹوگل میل', sovereignBadge: 'خود مختار کلاؤڈ: اسلام آباد ڈیٹا سینٹر',
    searchPlaceholder: 'میل میں تلاش کریں', compose: 'لکھیں',
    inbox: 'ان باکس', starred: 'ستارہ لگے پیغام', snoozed: 'موخر کردہ', sent: 'بھیجے گئے',
    drafts: 'مسودے', important: 'اہم', allMail: 'تمام میل', spam: 'اسپام', trash: 'ٹریش',
    categories: 'زمرے', primary: 'بنیادی', promotions: 'پروموشنز',
    social: 'سوشل', updates: 'اپڈیٹس', labels: 'لیبل', addLabel: 'نئی لیبل بنائیں',
    storageUsed: '12.4 GB از 25 GB استعمال شدہ', storageSubtext: 'پاکستان میں محفوظ',
    manageStorage: 'اسٹوریج منیج کریں', selectAll: 'تمام', selectNone: 'کوئی نہیں',
    refresh: 'تازہ کریں', archive: 'آرکائیو', reportSpam: 'اسپام رپورٹ کریں', delete: 'حذف کریں',
    markRead: 'پڑھا ہوا کریں', markUnread: 'نہ پڑھا ہوا کریں', snooze: 'موخر کریں',
    reply: 'جواب دیں', forward: 'آگے بھیجیں', print: 'پرنٹ', send: 'بھیجیں',
    discardDraft: 'مسودہ حذف کریں', subject: 'موضوع', to: 'وصول کنندہ', cc: 'کاپی', bcc: 'پوشیدہ کاپی',
    settings: 'ترتیبات', language: 'زبان', theme: 'تھیم',
    securityVerified: 'TLS خفیہ کاری • پاکستان خودمختار PKI',
    emptyInbox: 'آپ کا ان باکس صاف ہے۔',
    messageSent: 'پیغام بھیج دیا گیا', movedToTrash: 'پیغام ٹریش میں منتقل کر دیا گیا',
    savedDraft: 'مسودہ محفوظ ہو گیا', undo: 'کالعدم',
  },
};

export const URDU_PHRASES = [
  'السلام علیکم و رحمتہ اللہ', 'محترم جناب / محترمہ',
  'امید ہے آپ خیریت سے ہوں گے', 'برائے مہربانی منسلک دستاویز ملاحظہ فرمائیں',
  'آپ کے تعاون کا بہت شکریہ', 'جزاك الله خير',
  'فی امان اللہ', 'والسلام، کاظم محمود',
];

class LocalizationManager {
  currentLang: Lang;

  constructor() {
    this.currentLang = (localStorage.getItem('toggle_mail_lang') as Lang) || 'en';
  }

  getLang(): Lang { return this.currentLang; }

  t(key: string): string {
    const dict = TRANSLATIONS[this.currentLang] ?? TRANSLATIONS.en;
    return dict[key] ?? TRANSLATIONS.en[key] ?? key;
  }

  setLang(lang: Lang) {
    this.currentLang = lang;
    localStorage.setItem('toggle_mail_lang', lang);
    document.documentElement.lang = lang;
    if (lang === 'ur') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.body.classList.add('urdu-mode');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.body.classList.remove('urdu-mode');
    }
    this.applyToDOM();
    window.dispatchEvent(new CustomEvent('toggle_mail_lang_change', { detail: { lang } }));
  }

  toggle() { this.setLang(this.currentLang === 'en' ? 'ur' : 'en'); }

  applyToDOM() {
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n')!;
      const text = this.t(key);
      if (el instanceof HTMLInputElement) el.placeholder = text;
      else el.textContent = text;
    });
    document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach(el => {
      el.title = this.t(el.getAttribute('data-i18n-title')!);
    });
  }
}

export const i18n = new LocalizationManager();
