<div align="center">

<!-- HERO BANNER SVG -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 200" width="900" height="200">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f2027"/>
      <stop offset="50%" style="stop-color:#203a43"/>
      <stop offset="100%" style="stop-color:#2c5364"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#4facfe"/>
      <stop offset="100%" style="stop-color:#00f2fe"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="900" height="200" fill="url(#bg)" rx="12"/>

  <!-- Decorative circles -->
  <circle cx="820" cy="30" r="60" fill="#4facfe" opacity="0.06"/>
  <circle cx="80"  cy="170" r="80" fill="#00f2fe" opacity="0.05"/>
  <circle cx="450" cy="0"   r="120" fill="#203a43" opacity="0.4"/>

  <!-- Grid dots pattern -->
  <g opacity="0.12" fill="#4facfe">
    <circle cx="760" cy="60"  r="1.5"/>
    <circle cx="780" cy="60"  r="1.5"/>
    <circle cx="800" cy="60"  r="1.5"/>
    <circle cx="760" cy="80"  r="1.5"/>
    <circle cx="780" cy="80"  r="1.5"/>
    <circle cx="800" cy="80"  r="1.5"/>
    <circle cx="760" cy="100" r="1.5"/>
    <circle cx="780" cy="100" r="1.5"/>
    <circle cx="800" cy="100" r="1.5"/>
    <circle cx="120" cy="50"  r="1.5"/>
    <circle cx="140" cy="50"  r="1.5"/>
    <circle cx="120" cy="70"  r="1.5"/>
    <circle cx="140" cy="70"  r="1.5"/>
  </g>

  <!-- Mail icon -->
  <g transform="translate(60, 72)" filter="url(#glow)">
    <rect width="56" height="40" rx="4" fill="none" stroke="url(#accent)" stroke-width="2"/>
    <polyline points="0,0 28,22 56,0" fill="none" stroke="url(#accent)" stroke-width="2"/>
  </g>

  <!-- Title -->
  <text x="140" y="105" font-family="'Google Sans', 'Segoe UI', sans-serif" font-size="42" font-weight="700" fill="url(#accent)" filter="url(#glow)">Toggle Mail</text>

  <!-- Subtitle -->
  <text x="141" y="135" font-family="'Segoe UI', sans-serif" font-size="15" fill="#a8d8ea" opacity="0.9">Pakistan's Enterprise Email Platform — Built for Sovereign Infrastructure</text>

  <!-- Version pill -->
  <rect x="141" y="148" width="68" height="22" rx="11" fill="#4facfe" opacity="0.2"/>
  <text x="175" y="163" font-family="'Segoe UI', sans-serif" font-size="11" fill="#4facfe" text-anchor="middle" font-weight="600">v 2.0.0</text>

  <!-- TypeScript pill -->
  <rect x="220" y="148" width="90" height="22" rx="11" fill="#3178c6" opacity="0.25"/>
  <text x="265" y="163" font-family="'Segoe UI', sans-serif" font-size="11" fill="#6ab0f5" text-anchor="middle" font-weight="600">TypeScript</text>

  <!-- Vite pill -->
  <rect x="320" y="148" width="60" height="22" rx="11" fill="#646cff" opacity="0.25"/>
  <text x="350" y="163" font-family="'Segoe UI', sans-serif" font-size="11" fill="#a8a5ff" text-anchor="middle" font-weight="600">Vite 5</text>

  <!-- Right decorative envelope stack -->
  <g transform="translate(710, 50)" opacity="0.18" stroke="#4facfe" stroke-width="1.2" fill="none">
    <rect x="20" y="20" width="120" height="85" rx="5"/>
    <polyline points="20,20 80,62 140,20"/>
    <rect x="10" y="10" width="120" height="85" rx="5"/>
    <polyline points="10,10 70,52 130,10"/>
  </g>
</svg>

<br/>

<!-- BADGES -->
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.0.0-4facfe?style=for-the-badge)]()
[![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/Status-Active_Development-f9ab00?style=for-the-badge)]()

</div>

---

## 📬 Overview

**Toggle Mail** is a full-featured, production-grade email client built with vanilla **TypeScript** and **Vite** — designed to run on Pakistan's sovereign cloud infrastructure. It mirrors the polish and functionality of Google Workspace while remaining fully self-hosted and SSO-ready for enterprise deployments.

> Think Google Workspace Mail — but yours. Yours to host, yours to customize, yours to own.

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📨 Core Mail Engine
- **Gmail-style threaded conversations** — collapsible message cards, inline quick-reply
- **WYSIWYG compose** — rich text editor with formatting toolbar
- **Drag-and-drop attachments** — file upload with type detection and progress
- **Folder system** — Inbox, Starred, Snoozed, Sent, Drafts, Spam, Trash, All Mail
- **Category tabs** — Primary, Promotions, Social, Updates
- **Smart search** — operators: `from:`, `to:`, `subject:`, `label:`, `is:unread`, `has:attachment`

</td>
<td width="50%">

### ⚡ Backend Engine
- **Persistent JSON database** — live read/write email store at `data/emails.json`
- **Outbound SMTP** — real delivery engine with local-fallback for dev
- **Server-Sent Events (SSE)** — live push notifications, no polling
- **REST API** — full CRUD over `/api/emails`, `/api/threads`, `/api/storage`
- **Conversation threading** — subject-normalization + `threadId` aggregation
- **Advanced search parser** — tokenized operator evaluation on the backend

</td>
</tr>
<tr>
<td width="50%">

### 🎨 UI & Experience
- **Material Design 3** — Google-style cards, ripples, and surfaces
- **4 themes** — Light, Dark, Emerald, Slate (system-aware)
- **Compact / Comfortable density** — user-controlled
- **Micro-animations** — hover effects, toast stack, smooth transitions
- **Keyboard shortcuts** — Gmail-compatible (`c`, `/`, `r`, `f`, `e`, `#`, `?`)
- **Responsive** — works across screen sizes

</td>
<td width="50%">

### 🇵🇰 Pakistan-First Features
- **Urdu localization** — full RTL/LTR toggle (`en` / `ur`)
- **Prayer times widget** — Fajr → Isha for major cities
- **Pakistani holidays calendar** — 2024–2025 built-in
- **Raast / FBR / NADRA** — default label set for common workflows
- **Toggle PKI banner** — TLS + sovereign PKI verification indicator
- **`+92` contact support** — phone field formatted for Pakistan

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
│                                                                 │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────────┐  │
│  │ ui-controller│  │   state.ts    │  │    compose.ts       │  │
│  │  (DOM/render)│◄─│  (AppState)   │  │  (WYSIWYG + attach) │  │
│  └──────┬───────┘  └──────┬────────┘  └─────────────────────┘  │
│         │                 │                                     │
│         └─────────────────▼─────────────────────────────────┐  │
│                      api-client.ts                           │  │
│                   (Typed fetch layer)                        │  │
└──────────────────────────────┬──────────────────────────────┘  │
                               │ HTTP  /api/*                     │
                               ▼                                  │
┌─────────────────────────────────────────────────────────────────┐
│                   Vite Dev Server (Node.js)                     │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌───────────┐  │
│  │  api.ts    │  │ threads.ts │  │search.ts │  │ events.ts │  │
│  │(REST router│  │(Aggregation│  │(Operator │  │  (SSE hub)│  │
│  │ + handlers)│  │  engine)   │  │ tokenizer│  │           │  │
│  └──────┬─────┘  └────────────┘  └──────────┘  └───────────┘  │
│         │                                                       │
│  ┌──────▼─────┐  ┌────────────┐  ┌──────────┐                 │
│  │   db.ts    │  │  smtp.ts   │  │  sso.ts  │                 │
│  │ (JSON store│  │(SMTP engine│  │(SSO stub │                 │
│  │  + CRUD)   │  │ + fallback)│  │ / header)│                 │
│  └──────┬─────┘  └────────────┘  └──────────┘                 │
│         │                                                       │
│  data/emails.json    data/attachments/                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
toggle-mail/
├── index.html              # Single-page app shell + all CSS imports
├── vite.config.ts          # Vite + API middleware registration
├── tsconfig.json
│
├── src/                    # Client-side TypeScript
│   ├── main.ts             # Entry point
│   ├── ui-controller.ts    # Full DOM controller, rendering & event wiring
│   ├── state.ts            # Reactive AppState (pub/sub + localStorage)
│   ├── compose.ts          # WYSIWYG compose modal + drag-and-drop attachments
│   ├── api-client.ts       # Typed fetch wrapper for all /api/* endpoints
│   ├── types.ts            # Email, Thread, Attachment, Label interfaces
│   ├── localization.ts     # en/ur i18n + RTL support
│   ├── sound.ts            # Notification sound engine
│   └── mock-data.ts        # Seed emails, contacts, prayer times, holidays
│
├── server/                 # Node.js backend (loaded by Vite middleware)
│   ├── api.ts              # REST API router (emails, threads, storage, events)
│   ├── db.ts               # JSON-backed persistent email store
│   ├── threads.ts          # Conversation threading + subject normalization
│   ├── search.ts           # Search operator tokenizer & evaluator
│   ├── smtp.ts             # Outbound SMTP engine with local fallback
│   ├── events.ts           # Server-Sent Events hub (live push)
│   └── sso.ts              # SSO header extractor (SSO stub)
│
├── css/                    # Stylesheet modules
│   ├── email-view.css      # Thread cards, inline reply, attachment cards
│   └── ...                 # Component-level CSS
│
└── data/                   # Runtime data (gitignored in production)
    ├── emails.json         # Persistent email store
    └── attachments/        # Uploaded file blobs
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| [Node.js](https://nodejs.org/) | `≥ 18.0` |
| npm | `≥ 9.0` |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Dattebayoolo/Toggle-Mail.git
cd toggle-mail

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will open at **[http://localhost:3000](http://localhost:3000)** 🎉

### Other Commands

```bash
# Type-check without emitting
npm run typecheck

# Build production bundle
npm run build

# Preview production build
npm run preview
```

---

## 🔌 API Reference

All endpoints are served under `/api/` by the Vite dev middleware.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user` | Returns current SSO user context |
| `GET` | `/api/emails` | List emails (filter by folder, category, label, search) |
| `GET` | `/api/emails/:id` | Get single email by ID |
| `POST` | `/api/emails/send` | Send an email via SMTP engine |
| `POST` | `/api/emails/draft` | Save a draft |
| `PATCH` | `/api/emails/:id` | Update email metadata (read, star, folder, labels) |
| `POST` | `/api/emails/batch` | Bulk actions (move, markRead, star, delete) |
| `POST` | `/api/emails/sync` | Trigger IMAP sync (future) |
| `GET` | `/api/threads` | List conversation threads |
| `GET` | `/api/threads/:id` | Get full thread with all messages |
| `POST` | `/api/attachments/upload` | Upload a file attachment |
| `GET` | `/api/storage` | Get storage usage stats |
| `GET` | `/api/events` | Subscribe to SSE push stream |

### Search Operators

```
from:ali@company.pk
to:team@toggle.pk
subject:invoice
label:Raast & Banking
is:unread
is:starred
has:attachment
after:2024-01-01
before:2024-12-31
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `c` | Compose new email |
| `/` | Focus search bar |
| `?` | Show keyboard shortcuts |
| `r` | Reply to selected email |
| `f` | Forward selected email |
| `e` | Archive selected email |
| `#` | Delete selected email |
| `s` | Toggle star |
| `u` | Back to inbox |
| `!` | Report as spam |
| `Ctrl+Z` | Undo last action |

---

## 🔐 SSO Integration

Toggle Mail ships with an **SSO stub** (`server/sso.ts`) that reads identity from standard HTTP headers. This makes it compatible with any reverse-proxy SSO provider (Keycloak, Azure AD, Okta, custom PKI).

```typescript
// server/sso.ts — plug in your SSO provider here
// Headers read: x-user-email, x-user-name, x-user-id, x-user-role
```

To integrate your organization's SSO:
1. Configure your reverse proxy to inject the identity headers
2. Update the header names in `server/sso.ts` if needed
3. The backend will automatically pick up the authenticated user context

---

## 🎨 Themes

Toggle Mail ships with **4 built-in themes**, switchable at runtime:

| Theme | Preview |
|-------|---------|
| ☀️ **Light** | Clean white surfaces, Google Blue primary |
| 🌙 **Dark** | Deep `#202124` background, crisp contrast |
| 🌿 **Emerald** | Pakistan green accent on dark canvas |
| 🪨 **Slate** | Cool-gray surfaces, enterprise feel |

---

## 🗺️ Roadmap

- [x] **v0.1** — Core UI, folder navigation, compose, mock data, theming
- [x] **v0.2** — Backend engine, persistent DB, SMTP, threading, search operators, SSE, WYSIWYG, attachments
- [ ] **v0.3** — IMAP/POP3 inbound sync, real-time SSE inbox push, read receipts
- [ ] **v0.4** — Mobile-responsive layout, PWA manifest, offline support
- [ ] **v1.0** — SSO integration, multi-account, admin panel, audit logs

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

```bash
# Fork → Clone → Create feature branch
git checkout -b feature/amazing-feature

# Make your changes, then commit
git commit -m "feat: add amazing feature"

# Push and open a Pull Request
git push origin feature/amazing-feature
```

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

<!-- FOOTER SVG -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 80" width="900" height="80">
  <defs>
    <linearGradient id="footerBg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#0f2027"/>
      <stop offset="50%" style="stop-color:#203a43"/>
      <stop offset="100%" style="stop-color:#2c5364"/>
    </linearGradient>
    <linearGradient id="footerAccent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#4facfe"/>
      <stop offset="100%" style="stop-color:#00f2fe"/>
    </linearGradient>
  </defs>
  <rect width="900" height="80" fill="url(#footerBg)" rx="8"/>

  <!-- Pakistan flag green stripe subtle -->
  <rect x="0" y="0" width="6" height="80" fill="#01411C" rx="3"/>

  <!-- Mail icon small -->
  <g transform="translate(30, 22)">
    <rect width="32" height="22" rx="3" fill="none" stroke="url(#footerAccent)" stroke-width="1.5"/>
    <polyline points="0,0 16,13 32,0" fill="none" stroke="url(#footerAccent)" stroke-width="1.5"/>
  </g>

  <text x="76" y="35" font-family="'Google Sans','Segoe UI',sans-serif" font-size="15" font-weight="700" fill="url(#footerAccent)">Toggle Mail</text>
  <text x="76" y="54" font-family="'Segoe UI',sans-serif" font-size="11" fill="#a8d8ea" opacity="0.7">Pakistan's Sovereign Email Platform · Built with ❤️ in Islamabad</text>

  <!-- Right side: tech stack -->
  <text x="700" y="35" font-family="'Segoe UI',sans-serif" font-size="11" fill="#4facfe" text-anchor="middle">TypeScript + Vite + Node.js</text>
  <text x="700" y="54" font-family="'Segoe UI',sans-serif" font-size="11" fill="#a8d8ea" opacity="0.6" text-anchor="middle">MIT License · v2.0.0</text>

  <!-- Decorative dots -->
  <circle cx="860" cy="25" r="3" fill="#4facfe" opacity="0.4"/>
  <circle cx="872" cy="25" r="3" fill="#4facfe" opacity="0.25"/>
  <circle cx="860" cy="55" r="3" fill="#00f2fe" opacity="0.25"/>
  <circle cx="872" cy="55" r="3" fill="#00f2fe" opacity="0.4"/>
</svg>

<br/>

**Made with ❤️ by [Toggle PK](https://github.com/Dattebayoolo)**

</div>
