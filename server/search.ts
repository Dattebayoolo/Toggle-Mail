// ============================================================
// Toggle Mail – Advanced Search Operator Parser
// Supports Google-style queries (from:, to:, has:attachment, etc.)
// ============================================================

import type { EmailRecord } from './db';

export interface SearchFilter {
  from?: string;
  to?: string;
  subject?: string;
  hasAttachment?: boolean;
  isRead?: boolean;
  isStarred?: boolean;
  isImportant?: boolean;
  after?: Date;
  before?: Date;
  label?: string;
  folder?: string;
  keywords: string[];
}

export function parseSearchQuery(query: string): SearchFilter {
  const filter: SearchFilter = { keywords: [] };
  if (!query || !query.trim()) return filter;

  // Regex to match key:value or key:"quoted value" or plain words
  const tokenRegex = /(?:(\w+):(?:"([^"]+)"|([^\s]+)))|(?:"([^"]+)"|([^\s]+))/g;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(query)) !== null) {
    const operator = match[1]?.toLowerCase();
    const opValue = match[2] || match[3];
    const plainWord = match[4] || match[5];

    if (operator && opValue) {
      switch (operator) {
        case 'from':
          filter.from = opValue.toLowerCase();
          break;
        case 'to':
          filter.to = opValue.toLowerCase();
          break;
        case 'subject':
          filter.subject = opValue.toLowerCase();
          break;
        case 'has':
          if (opValue.toLowerCase() === 'attachment') filter.hasAttachment = true;
          break;
        case 'is':
          if (opValue.toLowerCase() === 'unread') filter.isRead = false;
          else if (opValue.toLowerCase() === 'read') filter.isRead = true;
          else if (opValue.toLowerCase() === 'starred') filter.isStarred = true;
          else if (opValue.toLowerCase() === 'important') filter.isImportant = true;
          break;
        case 'label':
          filter.label = opValue.toLowerCase();
          break;
        case 'folder':
        case 'in':
          filter.folder = opValue.toLowerCase();
          break;
        case 'after':
        case 'since':
          filter.after = new Date(opValue);
          break;
        case 'before':
        case 'until':
          filter.before = new Date(opValue);
          break;
        default:
          filter.keywords.push(`${operator}:${opValue}`);
      }
    } else if (plainWord) {
      filter.keywords.push(plainWord.toLowerCase());
    }
  }

  return filter;
}

export function evaluateSearch(emails: EmailRecord[], filter: SearchFilter): EmailRecord[] {
  return emails.filter(em => {
    if (filter.from && !em.from.toLowerCase().includes(filter.from) && !em.fromName.toLowerCase().includes(filter.from)) {
      return false;
    }
    if (filter.to && !em.to.toLowerCase().includes(filter.to)) {
      return false;
    }
    if (filter.subject && !em.subject.toLowerCase().includes(filter.subject)) {
      return false;
    }
    if (filter.hasAttachment !== undefined) {
      const has = em.attachments && em.attachments.length > 0;
      if (filter.hasAttachment !== has) return false;
    }
    if (filter.isRead !== undefined && em.isRead !== filter.isRead) {
      return false;
    }
    if (filter.isStarred !== undefined && em.isStarred !== filter.isStarred) {
      return false;
    }
    if (filter.isImportant !== undefined && em.isImportant !== filter.isImportant) {
      return false;
    }
    if (filter.label) {
      const match = em.labels.some(l => l.toLowerCase().includes(filter.label!));
      if (!match) return false;
    }
    if (filter.folder && em.folder.toLowerCase() !== filter.folder) {
      return false;
    }
    if (filter.after && new Date(em.date) < filter.after) {
      return false;
    }
    if (filter.before && new Date(em.date) > filter.before) {
      return false;
    }
    if (filter.keywords.length > 0) {
      const haystack = `${em.subject} ${em.from} ${em.fromName} ${em.snippet} ${em.body}`.toLowerCase();
      const allFound = filter.keywords.every(kw => haystack.includes(kw));
      if (!allFound) return false;
    }
    return true;
  });
}
