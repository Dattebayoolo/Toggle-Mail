// ============================================================
// Toggle Mail - Core Type Definitions
// Pakistan Sovereign Cloud Email Platform
// ============================================================

export interface Email {
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
  attachments: Attachment[];
  threadId?: string;
}

export interface Thread {
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
  folder: Email['folder'];
  category: Email['category'];
  messages: Email[];
}

export interface Attachment {
  name: string;
  size: string;
  type: string;
}

export interface Label {
  name: string;
  color: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  date: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface Contact {
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface CalendarEvent {
  title: string;
  date: string;
  type: string;
}

export interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
}

export interface PrayerCities {
  [city: string]: PrayerTimes;
}

export type Theme = 'light' | 'dark' | 'emerald' | 'slate';
export type Density = 'comfortable' | 'compact';
export type Lang = 'en' | 'ur';
export type Folder = 'inbox' | 'starred' | 'snoozed' | 'sent' | 'drafts' | 'important' | 'allMail' | 'spam' | 'trash';
export type Category = 'primary' | 'promotions' | 'social' | 'updates';

export interface UndoItem {
  action: 'archive' | 'delete';
  items: Array<{ id: string; prevFolder: string; emailObj?: Email }>;
}
