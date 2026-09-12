// ============================================================
// Toggle Mail - Mock Data (TypeScript)
// Realistic Pakistani Ecosystem Emails, Contacts, Prayer Times
// ============================================================

import type { Email, Contact, Task, Note, CalendarEvent, PrayerCities } from './types';

export const INITIAL_EMAILS: Email[] = [
  {
    id: 'em-1',
    from: 'State Bank of Pakistan <raast-notifications@sbp.org.pk>',
    fromName: 'State Bank of Pakistan (Raast)',
    fromAvatar: 'SBP',
    fromEmail: 'raast-notifications@sbp.org.pk',
    to: 'Kazam Mahmood <kazam@toggle.pk>',
    subject: 'Raast Instant Settlement: PKR 45,000 received in your Account',
    snippet: 'Dear Customer, an instant Raast P2P transaction of PKR 45,000.00 from HBL has been credited...',
    body: `<div style="font-family:'Roboto',sans-serif;color:#202124;line-height:1.6">
      <div style="background:linear-gradient(135deg,#0b6623,#15803d);padding:20px;border-radius:8px 8px 0 0;color:white">
        <h2 style="margin:0;font-size:20px">Raast Instant Payment Gateway (SBP)</h2>
        <p style="margin:6px 0 0;opacity:.9;font-size:13px">Pakistan's National Digital Payment System</p>
      </div>
      <div style="border:1px solid #e0e0e0;border-top:none;padding:24px;border-radius:0 0 8px 8px;background:#fafafa">
        <div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:20px">
          <div style="font-size:14px;color:#5f6368">Amount Credited</div>
          <div style="font-size:32px;font-weight:700;color:#0b6623;margin:4px 0 16px">PKR 45,000.00</div>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr style="border-bottom:1px solid #f1f3f4"><td style="padding:10px 0;color:#5f6368;width:40%">Transaction ID (STAN)</td><td style="padding:10px 0;font-weight:600">RAAST-PK-20260911-8932471</td></tr>
            <tr style="border-bottom:1px solid #f1f3f4"><td style="padding:10px 0;color:#5f6368">Sender</td><td style="padding:10px 0;font-weight:600">Muhammad Haris Khan (HBL)</td></tr>
            <tr><td style="padding:10px 0;color:#5f6368">Date &amp; Time</td><td style="padding:10px 0;font-weight:600">11 September 2026, 08:35 PM PKT</td></tr>
          </table>
        </div>
        <div style="background:#e8f5e9;border-left:4px solid #0b6623;padding:12px;border-radius:4px;font-size:13px;color:#1e4620">
          <strong>Toggle Mail Sovereign Security:</strong> This transaction was encrypted via Pakistan Sovereign PKI.
        </div>
      </div>
    </div>`,
    date: '2026-09-11T20:35:00+05:00',
    folder: 'inbox',
    category: 'primary',
    isRead: false,
    isStarred: true,
    isImportant: true,
    labels: ['Raast & Banking'],
    attachments: [{ name: 'Raast_Receipt_8932471.pdf', size: '240 KB', type: 'application/pdf' }],
  },
  {
    id: 'em-2',
    from: 'FBR IRIS <iris-noreply@fbr.gov.pk>',
    fromName: 'FBR e-Portal',
    fromAvatar: 'FBR',
    fromEmail: 'iris-noreply@fbr.gov.pk',
    to: 'kazam@toggle.pk',
    subject: 'FBR Tax Year 2026 – Income Tax Return Filed Successfully (NTN: 4820917)',
    snippet: 'Congratulations! Your Income Tax Return for Tax Year 2026 has been submitted and accepted on FBR IRIS 2.0...',
    body: `<div style="font-family:'Roboto',sans-serif;color:#202124;line-height:1.6">
      <div style="background:linear-gradient(135deg,#1a5276,#21618c);padding:20px;border-radius:8px 8px 0 0;color:white">
        <h2 style="margin:0">Federal Board of Revenue (FBR) – IRIS Portal</h2>
        <p style="margin:6px 0 0;opacity:.9;font-size:13px">Government of Pakistan – Ministry of Finance</p>
      </div>
      <div style="padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px">
        <p>Dear Kazam Mahmood (NTN: 4820917-2),</p>
        <p>Your <strong>Income Tax Return for Tax Year 2026</strong> has been successfully submitted on IRIS 2.0.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">
          <tr style="background:#f8f9fa"><td style="padding:10px;color:#5f6368">Filing Reference</td><td style="padding:10px;font-weight:600">FBR-ITR-2026-88321-KHI</td></tr>
          <tr><td style="padding:10px;color:#5f6368">Taxable Income</td><td style="padding:10px;font-weight:600">PKR 3,600,000</td></tr>
          <tr style="background:#f8f9fa"><td style="padding:10px;color:#5f6368">Tax Payable</td><td style="padding:10px;font-weight:600;color:#0b6623">PKR 0 (IT-Exempt under PSEB)</td></tr>
        </table>
      </div>
    </div>`,
    date: '2026-09-11T18:10:00+05:00',
    folder: 'inbox',
    category: 'updates',
    isRead: false,
    isStarred: false,
    isImportant: true,
    labels: ['FBR & Tax'],
    attachments: [{ name: 'ITR_2026_Acknowledgement.pdf', size: '380 KB', type: 'application/pdf' }],
  },
  {
    id: 'em-3',
    from: 'NADRA e-SNIC <esnic@nadra.gov.pk>',
    fromName: 'NADRA Pakistan',
    fromAvatar: 'NDR',
    fromEmail: 'esnic@nadra.gov.pk',
    to: 'kazam@toggle.pk',
    subject: 'NADRA Smart NICOP – Digital Application Approved & Dispatched',
    snippet: 'Your NICOP application has been approved. Your card will be delivered within 5-7 business days...',
    body: `<div style="font-family:'Roboto',sans-serif;color:#202124;line-height:1.6;padding:24px">
      <h2 style="color:#0b6623">NADRA Pakistan – National Identity Document</h2>
      <p>Dear Kazam Mahmood,</p>
      <p>Your <strong>Smart NICOP (National Identity Card for Overseas Pakistanis)</strong> application has been approved and dispatched.</p>
      <p><strong>CNIC Number:</strong> 35201-9876543-1<br>
      <strong>Dispatch Date:</strong> 11 September 2026<br>
      <strong>Expected Delivery:</strong> 5-7 Business Days via TCS Courier</p>
    </div>`,
    date: '2026-09-11T15:44:00+05:00',
    folder: 'inbox',
    category: 'updates',
    isRead: true,
    isStarred: false,
    isImportant: false,
    labels: ['NADRA'],
    attachments: [],
  },
  {
    id: 'em-4',
    from: 'JazzCash <noreply@jazzcash.com.pk>',
    fromName: 'JazzCash',
    fromAvatar: 'JC',
    fromEmail: 'noreply@jazzcash.com.pk',
    to: 'kazam@toggle.pk',
    subject: 'JazzCash: PKR 12,500 Transferred Successfully via Mobile Wallet',
    snippet: 'Your JazzCash transfer of PKR 12,500 to Umer Farooq was completed. Reference: JC-2026-7743...',
    body: `<div style="font-family:'Roboto',sans-serif;padding:24px;color:#202124">
      <h2 style="color:#e91e63">JazzCash Mobile Wallet</h2>
      <p>Your transfer of <strong>PKR 12,500</strong> was successfully sent.</p>
      <p><strong>Recipient:</strong> Umer Farooq (+92-333-XXXXXXX)<br>
      <strong>Reference:</strong> JC-2026-7743<br>
      <strong>Date:</strong> 11 Sep 2026, 2:30 PM PKT</p>
    </div>`,
    date: '2026-09-11T14:30:00+05:00',
    folder: 'inbox',
    category: 'primary',
    isRead: true,
    isStarred: false,
    isImportant: false,
    labels: ['Raast & Banking'],
    attachments: [],
  },
  {
    id: 'em-5',
    from: 'Daraz Pakistan <orders@daraz.pk>',
    fromName: 'Daraz PK',
    fromAvatar: 'DZ',
    fromEmail: 'orders@daraz.pk',
    to: 'kazam@toggle.pk',
    subject: 'Your Order #PK-DRZ-88910 is Out for Delivery – TCS Courier',
    snippet: 'Your package is on the way! The delivery agent will arrive today between 12 PM – 6 PM...',
    body: `<div style="font-family:'Roboto',sans-serif;padding:24px;color:#202124">
      <h2 style="color:#f26522">Daraz Pakistan – Order Out for Delivery!</h2>
      <p>Hi Kazam, your order <strong>#PK-DRZ-88910</strong> is out for delivery today.</p>
      <p><strong>Items:</strong> Samsung Galaxy Buds3 Pro – Noise Cancelling<br>
      <strong>Courier:</strong> TCS Express (Tracking: TCS-88910-PK)<br>
      <strong>Amount:</strong> PKR 28,999 (COD or Raast QR)</p>
    </div>`,
    date: '2026-09-11T11:00:00+05:00',
    folder: 'inbox',
    category: 'promotions',
    isRead: true,
    isStarred: false,
    isImportant: false,
    labels: ['Orders & E-commerce'],
    attachments: [],
  },
  {
    id: 'em-6',
    from: 'PSEB <info@pseb.org.pk>',
    fromName: 'Pakistan Software Export Board',
    fromAvatar: 'PS',
    fromEmail: 'info@pseb.org.pk',
    to: 'kazam@toggle.pk',
    subject: 'PSEB IT Export Exemption Certificate – Renewed for FY 2026-27',
    snippet: 'Congratulations! Your IT Export Tax Exemption Certificate has been renewed under SRO 1456(I)/2023...',
    body: `<div style="font-family:'Roboto',sans-serif;padding:24px;color:#202124">
      <h2 style="color:#0b6623">Pakistan Software Export Board (PSEB)</h2>
      <p>Dear Kazam Mahmood,</p>
      <p>Your <strong>IT Export Exemption Certificate</strong> under SRO 1456(I)/2023 has been renewed for Financial Year 2026-27.</p>
      <p><strong>Certificate Number:</strong> PSEB-IT-EX-2026-KHI-4421<br>
      <strong>Valid Until:</strong> 30 June 2027<br>
      <strong>Eligible Export Revenue:</strong> Up to USD 1,000,000</p>
    </div>`,
    date: '2026-09-10T09:15:00+05:00',
    folder: 'inbox',
    category: 'updates',
    isRead: false,
    isStarred: true,
    isImportant: true,
    labels: ['FBR & Tax', 'Freelance & IT'],
    attachments: [{ name: 'PSEB_Exemption_Certificate_2026-27.pdf', size: '512 KB', type: 'application/pdf' }],
  },
  {
    id: 'em-7',
    from: 'Meezan Bank <alerts@meezanbank.com>',
    fromName: 'Meezan Bank',
    fromAvatar: 'MB',
    fromEmail: 'alerts@meezanbank.com',
    to: 'kazam@toggle.pk',
    subject: 'Meezan Bank: Account Statement September 2026 – Available for Download',
    snippet: 'Your monthly account statement for September 2026 is now available on the Meezan Mobile App...',
    body: `<div style="font-family:'Roboto',sans-serif;padding:24px;color:#202124">
      <h2 style="color:#00796b">Meezan Bank – Islamic Banking</h2>
      <p>Your Account Statement for September 2026 is ready.</p>
      <p><strong>Account:</strong> PK88MEZN0001234567890<br>
      <strong>Balance:</strong> PKR 2,34,500.00<br>
      <strong>Profit Rate:</strong> 11.5% p.a. (Mudarabah)</p>
    </div>`,
    date: '2026-09-10T08:00:00+05:00',
    folder: 'inbox',
    category: 'updates',
    isRead: true,
    isStarred: false,
    isImportant: false,
    labels: ['Raast & Banking'],
    attachments: [{ name: 'MeezanBank_Statement_Sep2026.pdf', size: '188 KB', type: 'application/pdf' }],
  },
  {
    id: 'em-8',
    from: 'Foodpanda Pakistan <no-reply@foodpanda.pk>',
    fromName: 'Foodpanda PK',
    fromAvatar: 'FP',
    fromEmail: 'no-reply@foodpanda.pk',
    to: 'kazam@toggle.pk',
    subject: 'Order Delivered! Rate your Charcoal Grill experience',
    snippet: 'Your order from Charcoal Grill has been delivered. How was your meal?',
    body: `<div style="font-family:'Roboto',sans-serif;padding:24px;color:#202124">
      <h2 style="color:#e03c7a">Foodpanda – Order Delivered!</h2>
      <p>Your order from <strong>Charcoal Grill (DHA Lahore)</strong> was delivered.</p>
      <p><strong>Items:</strong> BBQ Platter x1, Naan x4, Raita<br>
      <strong>Total:</strong> PKR 2,450<br>
      <strong>Delivered:</strong> 11 Sep 2026, 9:05 PM</p>
      <p>Tap below to rate your experience!</p>
    </div>`,
    date: '2026-09-09T21:05:00+05:00',
    folder: 'inbox',
    category: 'promotions',
    isRead: true,
    isStarred: false,
    isImportant: false,
    labels: ['Orders & E-commerce'],
    attachments: [],
  },
  {
    id: 'em-9',
    from: 'Ali Shahbaz <ali.shahbaz@techventures.pk>',
    fromName: 'Ali Shahbaz',
    fromAvatar: 'AS',
    fromEmail: 'ali.shahbaz@techventures.pk',
    to: 'kazam@toggle.pk',
    subject: 'Re: Project Proposal – Toggle Mail API Integration with Raast',
    snippet: 'Assalam o Alaikum Kazam bhai, I have reviewed the proposal. The integration timeline looks solid...',
    body: `<div style="font-family:'Roboto',sans-serif;padding:24px;color:#202124">
      <p>Assalam o Alaikum Kazam bhai,</p>
      <p>I have reviewed the Toggle Mail x Raast API Integration proposal. The timeline looks solid and the budget is aligned with PSEB grant requirements.</p>
      <p>Let's schedule a call this week to finalize the MoU. I'll send the draft agreement shortly.</p>
      <p>JazakAllah Khair,<br><strong>Ali Shahbaz</strong><br>CTO, TechVentures PK</p>
    </div>`,
    date: '2026-09-09T16:20:00+05:00',
    folder: 'inbox',
    category: 'primary',
    isRead: false,
    isStarred: true,
    isImportant: true,
    labels: ['Freelance & IT'],
    attachments: [],
  },
];

export const INITIAL_CONTACTS: Contact[] = [
  { name: 'Ali Shahbaz', email: 'ali.shahbaz@techventures.pk', phone: '+92-321-4567890', role: 'CTO – TechVentures PK' },
  { name: 'Sara Malik', email: 'sara.malik@pseb.org.pk', phone: '+92-300-9876543', role: 'Program Manager – PSEB' },
  { name: 'FBR Help Desk', email: 'helpdesk@fbr.gov.pk', phone: '051-111-772-772', role: 'Federal Board of Revenue' },
  { name: 'Ahmed Raza', email: 'ahmed.raza@meezanbank.com', phone: '+92-333-1122334', role: 'Relationship Manager – Meezan' },
  { name: 'inDrive Pakistan', email: 'support@indrive.pk', phone: '0800-46374', role: 'Ride-hailing Support' },
];

export const INITIAL_TASKS: Task[] = [
  { id: 'tsk-1', text: 'File FBR Monthly Sales Tax Return (Deadline: 15 Sep)', completed: false, date: '15 Sep 2026' },
  { id: 'tsk-2', text: 'Renew SSL Certificate for toggle.pk domain', completed: false, date: '20 Sep 2026' },
  { id: 'tsk-3', text: 'Submit PSEB quarterly export report', completed: true, date: '10 Sep 2026' },
  { id: 'tsk-4', text: 'Pay Meezan Bank credit card bill', completed: false, date: '18 Sep 2026' },
];

export const INITIAL_NOTES: Note[] = [
  { id: 'not-1', title: 'PSEB Tech License Notes', content: 'SRO 1456(I)/2023 – IT Export exemption valid through June 2027. Attach PSEB certificate with annual tax filing.', updatedAt: 'Sep 10' },
  { id: 'not-2', title: 'Raast API Docs', content: 'Sandbox URL: sandbox.raast.sbp.org.pk\nAPI Key: stored in Vault (ask DevOps)\nTest IBAN: PK88MEZN0001234567890', updatedAt: 'Sep 8' },
];

export const PAKISTAN_PRAYER_TIMES: PrayerCities = {
  Islamabad: { Fajr: '4:43 AM', Dhuhr: '12:10 PM', Asr: '4:32 PM', Maghrib: '6:38 PM', Isha: '8:03 PM' },
  Lahore:    { Fajr: '4:41 AM', Dhuhr: '12:08 PM', Asr: '4:30 PM', Maghrib: '6:35 PM', Isha: '8:01 PM' },
  Karachi:   { Fajr: '5:01 AM', Dhuhr: '12:22 PM', Asr: '4:44 PM', Maghrib: '6:48 PM', Isha: '8:09 PM' },
  Peshawar:  { Fajr: '4:36 AM', Dhuhr: '12:02 PM', Asr: '4:24 PM', Maghrib: '6:29 PM', Isha: '7:56 PM' },
  Quetta:    { Fajr: '4:52 AM', Dhuhr: '12:18 PM', Asr: '4:39 PM', Maghrib: '6:44 PM', Isha: '8:08 PM' },
};

export const PAKISTAN_HOLIDAYS: CalendarEvent[] = [
  { title: 'Defence Day', date: '6 Sep 2026', type: 'National Holiday' },
  { title: 'Eid Milad-un-Nabi (SAW)', date: '16 Sep 2026', type: 'Islamic Holiday' },
  { title: 'Miqaad Day', date: '27 Oct 2026', type: 'National Holiday' },
  { title: 'Allama Iqbal Day', date: '9 Nov 2026', type: 'National Holiday' },
  { title: 'Quaid-e-Azam Day', date: '25 Dec 2026', type: 'National Holiday' },
];
