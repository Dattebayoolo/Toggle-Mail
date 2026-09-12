# 🇵🇰 Toggle Mail
### Pakistan's Sovereign Local Alternative to Google Mail (Gmail)

Toggle Mail is a high-fidelity, sovereign Pakistani alternative to Google Mail. Built with Google's Material 3 design system, responsive layout, full offline persistence, and deep Pakistani local ecosystem integration.

---

## 🚀 How to Launch

Launch Toggle Mail using npm:

```bash
npm start
```
or
```bash
npm run dev
```

This will instantly start the local server and launch Toggle Mail in your default browser at `http://localhost:3000/`.

---

## 🌟 Key Features

1. **Google Material 3 UI & Aesthetics**:
   - Google-style top search bar with keyboard shortcut hint (`/`), instant search, clear button, and advanced query filter modal.
   - Collapsible left sidebar with Material 3 floating **Compose** pill button.
   - Category tabs: **Primary**, **Promotions**, **Social**, and **Updates** with unread count badges and active indicators.
   - 9-dot Google-style Pakistani App Launcher (Toggle Drive, Toggle Meet, Toggle Pay, Toggle Docs, Toggle Calendar, Toggle Notes).
   - User profile dropdown with Pakistani CNIC/tax filer status.

2. **Pakistani Local Ecosystem**:
   - Pre-loaded with authentic Pakistani emails:
     - **State Bank of Pakistan (Raast)**: Instant settlement and transaction slips.
     - **FBR (Federal Board of Revenue)**: Annual Income Tax Return acknowledgement & CPR challans.
     - **NADRA Pak-Identity**: Smart National ID Card (SNIC) renewal and courier tracking.
     - **JazzCash & Easypaisa**: Merchant daily settlement and utility bill receipts.
     - **PSEB (Pakistan Software Export Board)**: 0.25% freelance IT remittance exemption certificate.
     - **Daraz PK**: 11.11 Mega Sale delivery via TCS tracking.
     - **Foodpanda & inDrive**: Ride and food delivery receipts.

3. **Bilingual Urdu & English Support (اردو)**:
   - 1-Click language toggle in the header with full **RTL layout transformation**.
   - Beautiful **Noto Nastaliq Urdu** typography.
   - Urdu mode inside Compose with virtual quick phrase buttons:
     - *السلام علیکم و رحمتہ اللہ*
     - *محترم جناب / محترمہ*
     - *برائے مہربانی منسلک دستاویز ملاحظہ فرمائیں*
     - *جزاك الله خير*
     - *فی امان اللہ*

4. **Companion Pakistani Side Panel**:
   - 🕌 **Namaz / Prayer Times**: Live daily timings for Islamabad, Lahore, Karachi, Peshawar, and Quetta.
   - 📅 **Pakistan Calendar**: National and Islamic public holidays (Eid, Pakistan Day, Independence Day, Quaid Day).
   - 💡 **Toggle Keep Notes**: Fast local note-taking with local storage sync.
   - ☑️ **Toggle Tasks**: Interactive task manager with completion checks and deletion.
   - 👥 **Contacts Directory**: Direct 1-click email composition to Pakistani institutions and colleagues.

5. **Email Management & Actions**:
   - Tri-state master selection checkbox (All, None, Read, Unread, Starred, Unstarred).
   - Batch operations: Archive, Delete (Move to Trash), Report Spam, Mark Read/Unread, Star, Snooze.
   - Print stylesheet for clean PDF export of invoices and tax notices.
   - Rich Compose modal: Minimize, Fullscreen, Recipient autocomplete, file attachments, and Schedule Send.

6. **Audio Feedback & Keyboard Shortcuts**:
   - Zero-dependency Web Audio API synthesizer for sending swoosh and notification chimes.
   - Shortcuts cheat sheet (`?`):
     - `c`: Compose new email
     - `r`: Reply to open message
     - `e`: Archive message
     - `#`: Delete / move to trash
     - `!`: Report as spam
     - `s`: Toggle star
     - `/`: Focus search bar
     - `Esc`: Close modals / return to inbox
