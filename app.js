'use strict';
/* Khatabook — bilingual (English / ગુજરાતી) customer ledger.
   Data: one private Firestore document per Google account in the
   billsplit-a7148 project (collection 'khatabook', doc id = auth UID),
   synced live like Billsplit. The old shared kb_main doc is imported
   once on a user's first sign-in, then left untouched.
   NOTE: the project's Firestore rules must lock each khatabook document
   to its owner (request.auth.uid == doc) for the privacy to be real;
   the app alone cannot enforce it. */

const $ = id => document.getElementById(id);
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const displayDate = iso => {
  if (!iso) return '';
  const parts = String(iso).slice(0, 10).split('-');
  if (parts.length !== 3) return String(iso);
  return parts[2] + ' ' + MON[+parts[1] - 1] + ' ' + parts[0];
};
const localToday = () => {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
};

/* ---------- strings: every visible string in English + Gujarati ---------- */
const STR = {
  en: {
    appName: 'Khatabook', tagline: 'Your digital ledger book',
    signInTitle: 'Sign in to Khatabook',
    signInDesc: 'Sign in with Google to see your ledger on all your devices.',
    signInGoogle: 'Sign in with Google', signingIn: 'Signing in…',
    signOut: 'Sign out',
    syncOn: '☁️ Cloud sync ON — your book syncs live across your devices.',
    syncOff: '☁️ Cloud sync could not connect — data still saves on this device.',
    syncUnavailable: '☁️ Cloud sync unavailable — data is stored on this device only.',
    authNote: 'Note: each Google account gets its own private book — no one else sees your entries.',
    totalToReceive: 'Total to receive', totalToPay: 'Total to pay',
    netBalance: 'Net balance', customers: 'Customers', customer: 'Customer',
    addCustomer: 'Add customer', editCustomer: 'Edit customer', deleteCustomer: 'Delete customer',
    search: 'Search customers…', sortBy: 'Sort by',
    sortName: 'Name', sortBalance: 'Balance', sortRecent: 'Most recent',
    duesOnly: 'Dues only', all: 'All',
    gave: 'You gave', got: 'You got',
    balance: 'Balance', youReceive: 'You will receive', youPay: 'You will pay',
    settled: 'Settled up',
    noCustomers: 'No customers yet',
    noCustomersHint: 'Tap “Add customer” to start your first khata.',
    name: 'Name', phone: 'Phone (optional)', email: 'Email (optional)', kbUser: 'KhataBook user',
    reports: 'Reports', report: 'Report', month: 'Month', monthly: 'Monthly breakdown',
    allTime: 'All time', totalGave: 'Total given', totalGot: 'Total received',
    copyReport: 'Copy report', noPeriodEntries: 'No entries in this period.',
    amount: 'Amount', date: 'Date',
    note: 'Note (optional)',
    addEntry: 'Add entry', editEntry: 'Edit entry', deleteEntry: 'Delete entry',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
    filterType: 'Entry type', from: 'From', to: 'To', clearFilters: 'Clear filters',
    back: 'Back', viewStatement: 'View statement', statement: 'Statement',
    statementFor: 'Statement for', generatedOn: 'Generated on',
    runningBalance: 'Running balance', total: 'Total',
    print: 'Print', copy: 'Copy', copied: 'Copied ✓', copyStatement: 'Copy statement',
    sendReminder: 'Payment reminder',
    reminderHint: 'A draft message only — nothing is sent from this app.',
    reminderText: 'Hi {name}, this is a friendly reminder that {amount} is pending from your khata with me. Please pay when convenient. Thank you!',
    close: 'Close', backup: 'Backup', export: 'Export backup', import: 'Import backup',
    system: 'System', light: 'Light', dark: 'Dark',
    confirmDeleteCustomer: 'Delete this customer and all their entries? This cannot be undone.',
    confirmDeleteEntry: 'Delete this entry? This cannot be undone.',
    customerAdded: 'Customer added ✓', customerUpdated: 'Customer updated ✓',
    customerDeleted: 'Customer deleted',
    entryAdded: 'Entry added ✓', entryUpdated: 'Entry updated ✓', entryDeleted: 'Entry deleted',
    oldBookMoved: 'Old book moved to your private book ✓',
    enterName: 'Enter a name', enterAmount: 'Enter an amount',
    addCustomerFirst: 'Add a customer first',
    investments: 'Investments', addInvestment: 'Add investment',
    ledger: 'Ledger', reminders: 'Reminders',
    calReminder: 'Calendar reminder',
    calReminderTitle: 'Reminder: {name} matures {date}',
    calFileSaved: 'Calendar file downloaded — open it and pick your calendar app', openingCalendar: 'Opening your calendar…',
    photo: 'Photo (optional)', removePhoto: 'Remove photo',
    photoTooLarge: 'Photo too large — try a smaller photo',
    bookTooLarge: 'Too many photos — remove an old photo first',
    paymentReminders: 'Payment reminders', addReminder: 'Add reminder', editReminder: 'Edit reminder',
    repeat: 'Repeat', repeatOnce: 'Once', repeatMonthly: 'Monthly', repeatYearly: 'Yearly',
    reminderAdded: 'Reminder added', reminderUpdated: 'Reminder updated', reminderDeleted: 'Reminder deleted',
    confirmDeleteReminder: 'Delete this reminder?',
    noReminders: 'No payment reminders yet',
    addFirstReminder: 'Add insurance premiums, bills and other due payments here.',
    overdue: 'Overdue', dueToday: 'Due today',
    dayLeft: 'day left',
    editInvestment: 'Edit investment', deleteInvestment: 'Delete investment',
    principal: 'Principal amount', annualRate: 'Annual interest rate (%)',
    startDate: 'Start date', maturityDate: 'Maturity date',
    remindDays: 'Remind me (days before)',
    daysLeft: 'days left', maturingSoon: 'Maturing soon', matured: 'Matured', active: 'Active',
    interestEarned: 'Interest', maturityValue: 'Maturity value',
    noInvestments: 'No investments yet',
    addFirstInvestment: 'Add your first fixed deposit or investment.',
    confirmDeleteInvestment: 'Delete this investment? This cannot be undone.',
    investmentAdded: 'Investment added ✓', investmentUpdated: 'Investment updated ✓',
    investmentDeleted: 'Investment deleted',
    enterPrincipal: 'Enter a principal amount',
    imported: 'Backup imported ✓', importFailed: 'That file could not be imported',
    exported: 'Backup downloaded ✓',
    noEntries: 'No entries yet', addFirstEntry: 'Add the first entry for this customer.',
    noEntriesMatch: 'No entries match these filters.',
    entries: 'entries',
    authErrorProvider: 'Sign-in failed: Google sign-in may not be enabled. In Firebase Console, go to Authentication → Sign-in method and enable Google.',
    authErrorDomain: 'Sign-in failed: this site’s domain is not allowed. In Firebase Console, go to Authentication → Settings → Authorized domains and add this domain.',
    authErrorClosed: 'Sign-in window was closed before finishing.',
    authErrorGeneric: 'Sign-in failed. Please try again.'
  },
  gu: {
    appName: 'ખાતાબુક', tagline: 'તમારી ડિજિટલ ખાતાબુક',
    signInTitle: 'ખાતાબુકમાં સાઇન ઇન કરો',
    signInDesc: 'બધા ડિવાઇસ પર તમારો હિસાબ જોવા માટે Google થી સાઇન ઇન કરો.',
    signInGoogle: 'Google થી સાઇન ઇન કરો', signingIn: 'સાઇન ઇન થઈ રહ્યું છે…',
    signOut: 'સાઇન આઉટ',
    syncOn: '☁️ ક્લાઉડ સિંક ચાલુ છે — તમારું ખાતું તમારા બધા ડિવાઇસમાં લાઇવ સિંક થાય છે.',
    syncOff: '☁️ ક્લાઉડ સિંક કનેક્ટ થઈ શક્યું નથી — ડેટા આ ડિવાઇસમાં સાચવાશે.',
    syncUnavailable: '☁️ ક્લાઉડ સિંક ઉપલબ્ધ નથી — ડેટા ફક્ત આ ડિવાઇસમાં જ સ્ટોર થશે.',
    authNote: 'નોંધ: દરેક Google એકાઉન્ટને પોતાનું ખાનગી ખાતું મળે છે — તમારી નોંધો બીજું કોઈ જોઈ શકતું નથી.',
    totalToReceive: 'કુલ લેવાના', totalToPay: 'કુલ આપવાના',
    netBalance: 'ચોખ્ખી બાકી', customers: 'ગ્રાહકો', customer: 'ગ્રાહક',
    addCustomer: 'ગ્રાહક ઉમેરો', editCustomer: 'ગ્રાહકમાં ફેરફાર કરો', deleteCustomer: 'ગ્રાહક કાઢી નાખો',
    search: 'ગ્રાહકો શોધો…', sortBy: 'ક્રમ',
    sortName: 'નામ', sortBalance: 'બાકી', sortRecent: 'તાજેતરના',
    duesOnly: 'માત્ર બાકીવાળા', all: 'બધા',
    gave: 'તમે આપ્યા', got: 'તમે મેળવ્યા',
    balance: 'બાકી', youReceive: 'તમે મેળવશો', youPay: 'તમે આપશો',
    settled: 'ચૂકતે',
    noCustomers: 'હજુ કોઈ ગ્રાહક નથી',
    noCustomersHint: 'પહેલું ખાતું શરૂ કરવા “ગ્રાહક ઉમેરો” દબાવો.',
    name: 'નામ', phone: 'ફોન (વૈકલ્પિક)', email: 'ઇમેઇલ (વૈકલ્પિક)', kbUser: 'ખાતાબુક યુઝર',
    reports: 'રિપોર્ટ્સ', report: 'રિપોર્ટ', month: 'મહિનો', monthly: 'માસિક વિગત',
    allTime: 'બધો સમય', totalGave: 'કુલ આપ્યા', totalGot: 'કુલ મેળવ્યા',
    copyReport: 'રિપોર્ટ કૉપી કરો', noPeriodEntries: 'આ સમયગાળામાં કોઈ નોંધ નથી.',
    amount: 'રકમ', date: 'તારીખ',
    note: 'નોંધ (વૈકલ્પિક)',
    addEntry: 'નોંધ ઉમેરો', editEntry: 'નોંધમાં ફેરફાર કરો', deleteEntry: 'નોંધ કાઢી નાખો',
    save: 'સાચવો', cancel: 'રદ કરો', delete: 'કાઢી નાખો', edit: 'ફેરફાર કરો',
    filterType: 'નોંધનો પ્રકાર', from: 'થી', to: 'સુધી', clearFilters: 'ફિલ્ટર સાફ કરો',
    back: 'પાછા', viewStatement: 'હિસાબ પત્રક જુઓ', statement: 'હિસાબ પત્રક',
    statementFor: 'હિસાબ પત્રક:', generatedOn: 'બનાવ્યું:',
    runningBalance: 'ચાલતી બાકી', total: 'કુલ',
    print: 'છાપો', copy: 'કૉપી કરો', copied: 'કૉપી થઈ ગયું ✓', copyStatement: 'હિસાબ પત્રક કૉપી કરો',
    sendReminder: 'ચુકવણી રિમાઇન્ડર',
    reminderHint: 'ફક્ત એક ડ્રાફ્ટ સંદેશ છે — આ એપમાંથી કંઈ મોકલવામાં આવતું નથી.',
    reminderText: 'નમસ્તે {name}, આ એક નમ્ર યાદ અપાવે છે કે મારી પાસે તમારા ખાતામાં {amount} બાકી છે. અનુકૂળતા મુજબ ચુકવણી કરવા વિનંતી. આભાર!',
    close: 'બંધ કરો', backup: 'બેકઅપ', export: 'બેકઅપ એક્સપોર્ટ', import: 'બેકઅપ ઇમ્પોર્ટ',
    system: 'સિસ્ટમ', light: 'લાઇટ', dark: 'ડાર્ક',
    confirmDeleteCustomer: 'આ ગ્રાહક અને તેની બધી નોંધો કાઢી નાખવી છે? આ પાછું લઈ શકાશે નહીં.',
    confirmDeleteEntry: 'આ નોંધ કાઢી નાખવી છે? આ પાછું લઈ શકાશે નહીં.',
    customerAdded: 'ગ્રાહક ઉમેરાયો ✓', customerUpdated: 'ગ્રાહક અપડેટ થયો ✓',
    customerDeleted: 'ગ્રાહક કાઢી નાખ્યો',
    entryAdded: 'નોંધ ઉમેરાઈ ✓', entryUpdated: 'નોંધ અપડેટ થઈ ✓', entryDeleted: 'નોંધ કાઢી નાખી',
    oldBookMoved: 'જૂનું ખાતું તમારા ખાનગી ખાતામાં ખસેડાયું ✓',
    enterName: 'નામ લખો', enterAmount: 'રકમ લખો',
    addCustomerFirst: 'પહેલા ગ્રાહક ઉમેરો',
    investments: 'રોકાણો', addInvestment: 'રોકાણ ઉમેરો',
    ledger: 'ખાતાવહી', reminders: 'રિમાઇન્ડર',
    calReminder: 'કેલેન્ડર રિમાઇન્ડર',
    calReminderTitle: 'યાદ: {name} {date} ના રોજ પાકે છે',
    calFileSaved: 'કેલેન્ડર ફાઇલ ડાઉનલોડ થઈ ગઈ — તેને ખોલીને તમારી કેલેન્ડર એપ પસંદ કરો', openingCalendar: 'તમારું કેલેન્ડર ખુલી રહ્યું છે…',
    photo: 'ફોટો (વૈકલ્પિક)', removePhoto: 'ફોટો દૂર કરો',
    photoTooLarge: 'ફોટો ખૂબ મોટો છે — નાનો ફોટો પસંદ કરો',
    bookTooLarge: 'ઘણા બધા ફોટા છે — પહેલા જૂનો ફોટો દૂર કરો',
    paymentReminders: 'ચુકવણી રિમાઇન્ડર', addReminder: 'રિમાઇન્ડર ઉમેરો', editReminder: 'રિમાઇન્ડર સુધારો',
    repeat: 'પુનરાવર્તન', repeatOnce: 'એક વાર', repeatMonthly: 'દર મહિને', repeatYearly: 'દર વર્ષે',
    reminderAdded: 'રિમાઇન્ડર ઉમેરાયું', reminderUpdated: 'રિમાઇન્ડર સુધારાયું', reminderDeleted: 'રિમાઇન્ડર દૂર કરાયું',
    confirmDeleteReminder: 'આ રિમાઇન્ડર દૂર કરવું છે?',
    noReminders: 'હજુ કોઈ ચુકવણી રિમાઇન્ડર નથી',
    addFirstReminder: 'અહીં વીમા પ્રીમિયમ, બિલ અને અન્ય ચુકવણીઓ ઉમેરો.',
    overdue: 'મુદત વીતી ગઈ', dueToday: 'આજે ચુકવવાનું',
    dayLeft: 'દિવસ બાકી',
    editInvestment: 'રોકાણમાં ફેરફાર કરો', deleteInvestment: 'રોકાણ કાઢી નાખો',
    principal: 'મૂળ રકમ', annualRate: 'વાર્ષિક વ્યાજ દર (%)',
    startDate: 'શરૂઆતની તારીખ', maturityDate: 'પાકવાની તારીખ',
    remindDays: 'કેટલા દિવસ પહેલા યાદ અપાવવું',
    daysLeft: 'દિવસ બાકી', maturingSoon: 'ટૂંક સમયમાં પાકશે', matured: 'પાકી ગયું', active: 'ચાલુ',
    interestEarned: 'વ્યાજ', maturityValue: 'પાકતી કિંમત',
    noInvestments: 'હજુ કોઈ રોકાણ નથી',
    addFirstInvestment: 'પહેલી ફિક્સ્ડ ડિપોઝિટ કે રોકાણ ઉમેરો.',
    confirmDeleteInvestment: 'આ રોકાણ કાઢી નાખવું છે? આ પાછું લઈ શકાશે નહીં.',
    investmentAdded: 'રોકાણ ઉમેરાયું ✓', investmentUpdated: 'રોકાણ અપડેટ થયું ✓',
    investmentDeleted: 'રોકાણ કાઢી નાખ્યું',
    enterPrincipal: 'મૂળ રકમ લખો',
    imported: 'બેકઅપ ઇમ્પોર્ટ થયો ✓', importFailed: 'તે ફાઇલ ઇમ્પોર્ટ થઈ શકી નથી',
    exported: 'બેકઅપ ડાઉનલોડ થયો ✓',
    noEntries: 'હજુ કોઈ નોંધ નથી', addFirstEntry: 'આ ગ્રાહક માટે પહેલી નોંધ ઉમેરો.',
    noEntriesMatch: 'આ ફિલ્ટરને મળતી કોઈ નોંધ નથી.',
    entries: 'નોંધો',
    authErrorProvider: 'સાઇન-ઇન નિષ્ફળ: Google સાઇન-ઇન કદાચ ચાલુ નથી. Firebase Console માં Authentication → Sign-in method માં Google ચાલુ કરો.',
    authErrorDomain: 'સાઇન-ઇન નિષ્ફળ: આ વેબસાઇટનું ડોમેન મંજૂર નથી. Firebase Console માં Authentication → Settings → Authorized domains માં આ ડોમેન ઉમેરો.',
    authErrorClosed: 'સાઇન-ઇન વિન્ડો પૂરી થતાં પહેલાં બંધ થઈ ગઈ.',
    authErrorGeneric: 'સાઇન-ઇન નિષ્ફળ. ફરી પ્રયત્ન કરો.'
  }
};

/* ---------- language: per device, not synced ---------- */
const LANG_KEY = 'khatabook.lang';
let lang = 'en';
try { const saved = localStorage.getItem(LANG_KEY); if (saved === 'gu' || saved === 'en') lang = saved; } catch (e) {}
const t = k => (STR[lang] && STR[lang][k]) || STR.en[k] || k;
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.documentElement.lang = lang === 'gu' ? 'gu' : 'en';
  document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
}
function setLang(l) {
  lang = l;
  try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
  applyTranslations();
  render();
}
document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));

/* ---------- theme: system default + manual override, per device (Billsplit v12) ---------- */
const THEME_KEY = 'khatabook.theme';
const themeMQ = window.matchMedia('(prefers-color-scheme: dark)');
function themeChoice() { try { return localStorage.getItem(THEME_KEY) || 'system'; } catch (e) { return 'system'; } }
function applyTheme() {
  const c = themeChoice();
  const dark = c === 'dark' || (c === 'system' && themeMQ.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelectorAll('.theme-seg .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.themeChoice === c));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#101613' : '#0b7a4b');
}
document.querySelectorAll('.theme-seg .seg-btn').forEach(b => b.addEventListener('click', () => {
  try { localStorage.setItem(THEME_KEY, b.dataset.themeChoice); } catch (e) {}
  applyTheme();
}));
if (themeMQ.addEventListener) themeMQ.addEventListener('change', applyTheme);

/* ---------- state ---------- */
const LS_KEY = 'khatabook.v1';
let currentUser = null; // set by auth; the cache key is per user so books never mix on one device
const cacheKey = () => currentUser ? LS_KEY + '.' + currentUser.uid : LS_KEY;
let state = { currency: 'INR', customers: [], entries: [], investments: [], reminders: [] };
function loadLocalCache() {
  try {
    const raw = localStorage.getItem(cacheKey());
    if (raw) {
      const p = JSON.parse(raw);
      if (p && Array.isArray(p.customers) && Array.isArray(p.entries)) {
        state = { currency: (p.currency === 'USD' ? 'USD' : 'INR'), customers: p.customers, entries: p.entries, investments: Array.isArray(p.investments) ? p.investments : [], reminders: Array.isArray(p.reminders) ? p.reminders : [] };
      }
    }
  } catch (e) {}
}
function save() { try { localStorage.setItem(cacheKey(), JSON.stringify(state)); } catch (e) {} schedulePush(); }

/* ---------- Firebase config (same project as Billsplit; separate document) ---------- */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCzleGE2qWif60DXoxaYGA3kqOuv1Xp94Y",
  authDomain: "billsplit-a7148.firebaseapp.com",
  projectId: "billsplit-a7148",
  storageBucket: "billsplit-a7148.firebasestorage.app",
  messagingSenderId: "356199360313",
  appId: "1:356199360313:web:880d18351664af49a3eae8"
};
/* Khatabook documents — one per user (doc id = auth UID), never the
   Billsplit households document. kb_main is only the legacy shared book,
   read once for migration on a user's first sign-in. */
const KB_COLLECTION = 'khatabook';
const KB_LEGACY_DOC = 'kb_main';
let kbRef = null, kbUnsub = null, lastPushed = '', pushTimer = null, syncStarted = false, pendingPush = false;
function schedulePush() {
  if (!kbRef) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, 700);
}
function pushNow() {
  if (!kbRef) return;
  if (!syncStarted) { pendingPush = true; return; }
  const payload = JSON.stringify(state);
  lastPushed = payload;
  kbRef.set({ state: payload, updatedAt: new Date().toISOString() }).catch(e => console.warn('Cloud push failed', e));
}
function validKb(o) {
  return o && Array.isArray(o.customers) && Array.isArray(o.entries) &&
    (o.currency === 'INR' || o.currency === 'USD' || !o.currency);
}
function adoptRemote(remote) {
  try {
    const p = JSON.parse(remote);
    if (!validKb(p)) return;
    state = { currency: (p.currency === 'USD' ? 'USD' : 'INR'), customers: p.customers, entries: p.entries, investments: Array.isArray(p.investments) ? p.investments : [], reminders: Array.isArray(p.reminders) ? p.reminders : [] };
    try { localStorage.setItem(cacheKey(), remote); } catch (e) {}
    render();
  } catch (e) { console.warn('Could not apply cloud data', e); }
}
function initSync(uid) {
  const el = $('syncStatus');
  if (!window.firebase) { if (el) el.textContent = t('syncUnavailable'); return; }
  try {
    if (kbUnsub) { kbUnsub(); kbUnsub = null; }
    syncStarted = false; pendingPush = false; lastPushed = '';
    kbRef = firebase.firestore().collection(KB_COLLECTION).doc(uid);
    kbUnsub = kbRef.onSnapshot(async snap => {
      const wasFirst = !syncStarted;
      syncStarted = true;
      if (el) el.textContent = t('syncOn');
      if (!snap.exists) {
        // First sign-in for this user: one-time import from the old shared book.
        try {
          const legacy = await firebase.firestore().collection(KB_COLLECTION).doc(KB_LEGACY_DOC).get();
          if (legacy.exists && legacy.data().state) {
            const p = JSON.parse(legacy.data().state);
            if (validKb(p) && (p.customers.length || p.entries.length)) {
              adoptRemote(legacy.data().state);
              pushNow();
              toast(t('oldBookMoved'));
              return;
            }
          }
        } catch (e) { console.warn('Legacy import failed', e); }
        pushNow(); return;
      }
      const remote = snap.data().state;
      if (!remote || remote === lastPushed) { if (pendingPush) { pendingPush = false; pushNow(); } return; }
      if (wasFirst) {
        try {
          const rp = JSON.parse(remote);
          const localCount = (state.customers || []).length + (state.entries || []).length;
          const remoteCount = (rp.customers || []).length + (rp.entries || []).length;
          if (localCount > remoteCount) { pushNow(); return; }
        } catch (e) {}
      }
      adoptRemote(remote);
      if (pendingPush) { pendingPush = false; pushNow(); }
    }, err => {
      console.warn('Cloud sync error', err);
      if (el) el.textContent = t('syncOff');
    });
  } catch (e) {
    console.warn('Cloud sync init failed', e);
    if (el) el.textContent = t('syncUnavailable');
  }
}

/* ---------- auth: Google sign-in gate ---------- */
let auth = null;
function showAuthError(e) {
  const box = $('authError');
  let key = 'authErrorGeneric';
  if (e && e.code === 'auth/operation-not-allowed') key = 'authErrorProvider';
  else if (e && e.code === 'auth/unauthorized-domain') key = 'authErrorDomain';
  else if (e && (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request')) key = 'authErrorClosed';
  box.textContent = t(key);
  box.classList.remove('hidden');
}
async function signIn() {
  const btn = $('googleSignInBtn');
  $('authError').classList.add('hidden');
  btn.disabled = true;
  btn.textContent = t('signingIn');
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (e) {
    if (e && e.code === 'auth/popup-blocked') {
      try { await auth.signInWithRedirect(provider); return; }
      catch (e2) { showAuthError(e2); }
    } else {
      showAuthError(e);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = t('signInGoogle');
  }
}
function initAuth() {
  if (!window.firebase) {
    $('authError').textContent = t('syncUnavailable');
    $('authError').classList.remove('hidden');
    return;
  }
  try { firebase.initializeApp(FIREBASE_CONFIG); } catch (e) {}
  auth = firebase.auth();
  try { auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch (e) {}
  try { auth.getRedirectResult().catch(() => {}); } catch (e) {}
  auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
      loadLocalCache();
      $('authView').classList.add('hidden');
      $('appView').classList.remove('hidden');
      $('userChip').textContent = user.displayName || user.email || '';
      $('userChip').classList.remove('hidden');
      $('signOutBtn').classList.remove('hidden');
      $('tabBar').classList.remove('hidden');
      initSync(user.uid);
      render();
    } else {
      if (kbUnsub) { kbUnsub(); kbUnsub = null; }
      kbRef = null; syncStarted = false; pendingPush = false;
      state = { currency: 'INR', customers: [], entries: [], investments: [] };
      $('authView').classList.remove('hidden');
      $('appView').classList.add('hidden');
      $('userChip').classList.add('hidden');
      $('signOutBtn').classList.add('hidden');
      $('tabBar').classList.add('hidden');
    }
  });
}
$('googleSignInBtn').addEventListener('click', signIn);
$('signOutBtn').addEventListener('click', () => {
  if (!auth) return;
  auth.signOut().then(() => location.reload()).catch(() => location.reload());
});

/* ---------- balances ---------- */
function fmt(n) {
  const sym = state.currency === 'USD' ? '$' : '₹';
  const loc = state.currency === 'USD' ? 'en-CA' : 'en-IN';
  return (n < 0 ? '−' : '') + sym + Math.abs(n).toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
/* Amount fields: plain digits while typing, commas + 2 decimals when done */
function fmtNum(n) {
  const loc = state.currency === 'USD' ? 'en-CA' : 'en-IN';
  return Number(n).toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function parseAmount(s) { return parseFloat(String(s).replace(/,/g, '')); }
/* Indian grouping on a digit string (no Number conversion, so huge values stay exact) */
function groupIndianDigits(d) {
  if (d.length <= 3) return d;
  const last3 = d.slice(-3);
  let head = d.slice(0, -3);
  const parts = [];
  while (head.length > 2) { parts.unshift(head.slice(-2)); head = head.slice(0, -2); }
  if (head) parts.unshift(head);
  return parts.join(',') + ',' + last3;
}
/* Live comma formatting while typing; caret follows the digit count */
function liveFormatAmount(el) {
  let raw = el.value;
  if (raw === '') return;
  if (!raw.includes('.') && raw.endsWith(',')) raw = raw.slice(0, -1) + '.';
  const caret = el.selectionStart ?? raw.length;
  const before = raw.slice(0, caret);
  const digitsBefore = before.replace(/[^0-9]/g, '').length;
  const dotBefore = before.includes('.');
  const cleaned = raw.replace(/,/g, '');
  const dotIdx = cleaned.indexOf('.');
  let intPart, decPart = null;
  if (dotIdx === -1) intPart = cleaned.replace(/[^0-9]/g, '');
  else { intPart = cleaned.slice(0, dotIdx).replace(/[^0-9]/g, ''); decPart = cleaned.slice(dotIdx + 1).replace(/[^0-9]/g, '').slice(0, 2); }
  intPart = intPart.replace(/^0+(?=\d)/, '');
  let formatted = groupIndianDigits(intPart);
  if (decPart !== null) formatted += '.' + decPart;
  if (formatted === '') { el.value = ''; return; }
  el.value = formatted;
  let di = 0, ni = 0;
  while (ni < formatted.length && di < digitsBefore) { if (/[0-9]/.test(formatted[ni])) di++; ni++; }
  if (dotBefore && formatted[ni] === '.') ni++;
  el.setSelectionRange(ni, ni);
}
function wireAmountInput(id) {
  const el = $(id);
  el.addEventListener('input', () => liveFormatAmount(el));
  el.addEventListener('blur', () => {
    const raw = el.value.trim();
    if (raw === '') return;
    const cleaned = raw.replace(/,/g, '');
    if (cleaned === '' || cleaned === '.') { el.value = ''; return; }
    const split = cleaned.split('.');
    const intPart = (split[0].replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '') || '0');
    const dec = (split[1] || '').replace(/[^0-9]/g, '').slice(0, 2).padEnd(2, '0');
    el.value = groupIndianDigits(intPart) + '.' + dec;
  });
}
['entryAmount', 'quickAmount', 'invPrincipal', 'remAmount'].forEach(wireAmountInput);
function balanceOf(id) {
  return round2(state.entries.filter(e => e.customerId === id)
    .reduce((a, e) => a + (e.type === 'gave' ? e.amount : -e.amount), 0));
}
function lastDateOf(id) {
  const ds = state.entries.filter(e => e.customerId === id).map(e => e.date);
  return ds.length ? ds.sort().pop() : '';
}
function totals() {
  let receive = 0, pay = 0;
  state.customers.forEach(c => {
    const b = balanceOf(c.id);
    if (b > 0.004) receive += b;
    else if (b < -0.004) pay += -b;
  });
  return { receive: round2(receive), pay: round2(pay), net: round2(receive - pay) };
}
function balLabel(b) {
  if (b > 0.004) return t('youReceive');
  if (b < -0.004) return t('youPay');
  return t('settled');
}
function balClass(b) {
  if (b > 0.004) return 'bal-pos';
  if (b < -0.004) return 'bal-neg';
  return 'bal-zero';
}

/* ---------- rendering ---------- */
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._h);
  el._h = setTimeout(() => el.classList.remove('show'), 2200);
}
let selectedId = null, sortKey = 'name', duesOnly = false;
let entryTypeFilter = 'all', dateFrom = '', dateTo = '';
let reportMonth = 'all', activeTab = 'ledger';

function render() {
  document.querySelectorAll('.curr-btn').forEach(b => b.classList.toggle('active', b.dataset.currency === state.currency));
  renderMaturingAlert();
  updateTabBar();
  $('reportView').classList.toggle('hidden', activeTab !== 'reports');
  $('investView').classList.toggle('hidden', activeTab !== 'investments');
  const ledger = activeTab === 'ledger';
  $('dashboardSection').classList.toggle('hidden', !ledger);
  $('backupSection').classList.toggle('hidden', !ledger);
  $('reminderSection').classList.toggle('hidden', activeTab !== 'reminders');
  if (activeTab === 'reports') { renderReports(); return; }
  if (activeTab === 'investments') { renderInvestments(); return; }
  if (activeTab === 'reminders') {
    renderReminders();
    $('listView').classList.add('hidden'); $('detailView').classList.add('hidden');
    return;
  }
  renderDashboard();
  renderCustomers();
  if (selectedId) { $('listView').classList.add('hidden'); $('detailView').classList.remove('hidden'); renderDetail(); }
  else { $('listView').classList.remove('hidden'); $('detailView').classList.add('hidden'); }
}
function renderDashboard() {
  const tot = totals();
  $('dashReceive').textContent = fmt(tot.receive);
  $('dashPay').textContent = fmt(tot.pay);
  $('dashNet').textContent = fmt(tot.net);
  $('dashCount').textContent = String(state.customers.length);
}
function renderCustomers() {
  const q = ($('searchInput').value || '').trim().toLowerCase();
  let list = [...state.customers];
  if (q) list = list.filter(c => c.name.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q));
  if (duesOnly) list = list.filter(c => Math.abs(balanceOf(c.id)) > 0.004);
  if (sortKey === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortKey === 'balance') list.sort((a, b) => balanceOf(b.id) - balanceOf(a.id) || a.name.localeCompare(b.name));
  else if (sortKey === 'recent') list.sort((a, b) => (lastDateOf(b.id) || '').localeCompare(lastDateOf(a.id) || '') || a.name.localeCompare(b.name));
  $('customerEmpty').classList.toggle('hidden', list.length > 0 || state.customers.length > 0);
  $('customerList').innerHTML = list.map(c => {
    const b = balanceOf(c.id);
    const initial = (c.name.trim()[0] || '?').toUpperCase();
    return `<button type="button" class="cust-row" data-open="${c.id}">
      ${c.image ? `<img class="cust-photo" src="${c.image}" alt="">` : `<span class="cust-avatar">${esc(initial)}</span>`}
      <span class="cust-main"><span class="cust-name">${esc(c.name)}</span>${c.kbUser ? `<span class="kb-badge">${t('kbUser')}</span>` : ''}${c.phone ? `<span class="cust-phone">${esc(c.phone)}</span>` : ''}${c.email ? `<span class="cust-phone">${esc(c.email)}</span>` : ''}</span>
      <span class="cust-bal ${balClass(b)}">${fmt(b)}<small>${balLabel(b)}</small></span>
    </button>`;
  }).join('');
}
function showList() {
  selectedId = null;
  activeTab = 'ledger';
  render();
}
function showReports() {
  activeTab = 'reports';
  render();
}
function showInvestments() {
  activeTab = 'investments';
  render();
}
function showReminders() {
  activeTab = 'reminders';
  render();
}
function showDetail(id) {
  selectedId = id;
  activeTab = 'ledger';
  render();
}
function renderDetail() {
  const c = state.customers.find(x => x.id === selectedId);
  if (!c) { showList(); return; }
  const b = balanceOf(c.id);
  $('detailName').textContent = c.name;
  $('detailPhone').textContent = c.phone || '';
  $('detailEmail').textContent = c.email || '';
  $('detailKbBadge').classList.toggle('hidden', !c.kbUser);
  const dp = $('detailPhoto');
  if (c.image) { dp.src = c.image; dp.classList.remove('hidden'); dp.dataset.viewPhoto = 'customer:' + c.id; }
  else { dp.src = ''; dp.classList.add('hidden'); delete dp.dataset.viewPhoto; }
  $('detailBalanceLabel').textContent = balLabel(b);
  const bv = $('detailBalanceValue');
  bv.textContent = fmt(b);
  bv.className = 'detail-balance-value ' + balClass(b);
  $('reminderBtn').classList.toggle('hidden', !(b > 0.004));
  let list = state.entries.filter(e => e.customerId === c.id);
  if (entryTypeFilter !== 'all') list = list.filter(e => e.type === entryTypeFilter);
  if (dateFrom) list = list.filter(e => e.date >= dateFrom);
  if (dateTo) list = list.filter(e => e.date <= dateTo);
  list = [...list].sort((a, b2) => b2.date.localeCompare(a.date) || (b2._seq || 0) - (a._seq || 0));
  const all = state.entries.filter(e => e.customerId === c.id);
  $('entryEmpty').classList.toggle('hidden', all.length > 0);
  $('entryNoMatch').classList.toggle('hidden', all.length === 0 || list.length > 0);
  $('entryList').innerHTML = list.map(e => {
    const typeLabel = e.type === 'gave' ? t('gave') : t('got');
    return `<div class="entry-row">
      <span class="entry-type ${e.type}">${typeLabel}</span>
      <span class="entry-main"><span class="entry-note">${e.note ? esc(e.note) : typeLabel}</span>
      <span class="entry-meta">${displayDate(e.date)}</span></span>
      ${e.image ? `<button type="button" class="entry-thumb" data-view-photo="entry:${e.id}" aria-label="${t('photo')}"><img src="${e.image}" alt=""></button>` : ''}
      <span class="entry-amt">${fmt(e.amount)}</span>
      <button type="button" class="entry-edit" data-edit-entry="${e.id}" aria-label="${t('edit')}">✎</button>
      <button type="button" class="entry-edit" data-delete-entry="${e.id}" aria-label="${t('delete')}">🗑</button>
    </div>`;
  }).join('');
}

/* ---------- overall reports ---------- */
function monthKey(iso) { return String(iso).slice(0, 7); }
function monthLabel(key) {
  const parts = key.split('-');
  return MON[+parts[1] - 1] + ' ' + parts[0];
}
function reportMonths() {
  return [...new Set(state.entries.map(e => monthKey(e.date)))].sort().reverse();
}
function periodData() {
  const months = reportMonths();
  const list = reportMonth === 'all' ? state.entries : state.entries.filter(e => monthKey(e.date) === reportMonth);
  let gave = 0, got = 0;
  list.forEach(e => { if (e.type === 'gave') gave += e.amount; else got += e.amount; });
  const per = state.customers.map(c => {
    const es = list.filter(e => e.customerId === c.id);
    let g = 0, r = 0;
    es.forEach(e => { if (e.type === 'gave') g += e.amount; else r += e.amount; });
    return { c, gave: round2(g), got: round2(r), bal: round2(g - r), n: es.length };
  }).filter(x => x.n > 0).sort((a, b) => Math.abs(b.bal) - Math.abs(a.bal) || a.c.name.localeCompare(b.c.name));
  return { months, list, gave: round2(gave), got: round2(got), per };
}
function renderReports() {
  const { months, list, gave, got, per } = periodData();
  const sel = $('reportMonth');
  sel.innerHTML = `<option value="all">${t('allTime')}</option>` + months.map(m => `<option value="${m}">${monthLabel(m)}</option>`).join('');
  if (!months.includes(reportMonth)) reportMonth = 'all';
  sel.value = reportMonth;
  const period = reportMonth === 'all' ? t('allTime') : monthLabel(reportMonth);
  $('reportGave').textContent = fmt(gave);
  $('reportGot').textContent = fmt(got);
  $('reportNet').textContent = fmt(round2(gave - got));
  $('reportCount').textContent = String(list.length);
  $('reportMeta').textContent = period + ' · ' + t('generatedOn') + ' ' + displayDate(localToday());
  $('reportEmpty').classList.toggle('hidden', list.length > 0);
  $('reportCustomerList').innerHTML = per.map(({ c, gave: g, got: r, bal, n }) =>
    `<div class="entry-row"><span class="entry-main"><span class="entry-note">${esc(c.name)}</span><span class="entry-meta">${t('gave')} ${fmt(g)} · ${t('got')} ${fmt(r)} · ${n} ${t('entries')}</span></span><span class="entry-amt ${balClass(bal)}">${fmt(bal)}</span></div>`
  ).join('');
  $('reportMonthSection').classList.toggle('hidden', reportMonth !== 'all');
  if (reportMonth === 'all') {
    $('reportMonthList').innerHTML = months.map(m => {
      const es = state.entries.filter(e => monthKey(e.date) === m);
      let g = 0, r = 0;
      es.forEach(e => { if (e.type === 'gave') g += e.amount; else r += e.amount; });
      const net = round2(g - r);
      return `<div class="entry-row"><span class="entry-main"><span class="entry-note">${monthLabel(m)}</span><span class="entry-meta">${t('gave')} ${fmt(g)} · ${t('got')} ${fmt(r)} · ${es.length} ${t('entries')}</span></span><span class="entry-amt ${balClass(net)}">${fmt(net)}</span></div>`;
    }).join('');
  }
}
function buildReportText() {
  const { list, gave, got, per, months } = periodData();
  const period = reportMonth === 'all' ? t('allTime') : monthLabel(reportMonth);
  const lines = [
    `${t('report')} — ${period}`,
    `${t('generatedOn')} ${displayDate(localToday())}`,
    '',
    `${t('totalGave')}: ${fmt(gave)}`,
    `${t('totalGot')}: ${fmt(got)}`,
    `${t('netBalance')}: ${fmt(round2(gave - got))}`,
    `${t('entries')}: ${list.length}`,
    ''
  ];
  if (reportMonth === 'all' && months.length) {
    lines.push(t('monthly') + ':');
    months.forEach(m => {
      const es = state.entries.filter(e => monthKey(e.date) === m);
      let g = 0, r = 0;
      es.forEach(e => { if (e.type === 'gave') g += e.amount; else r += e.amount; });
      lines.push(`${monthLabel(m)}: ${t('gave')} ${fmt(g)} · ${t('got')} ${fmt(r)} · ${t('netBalance')} ${fmt(round2(g - r))}`);
    });
    lines.push('');
  }
  lines.push(t('customers') + ':');
  per.forEach(({ c, gave: g, got: r, bal, n }) => {
    lines.push(`${c.name}: ${t('gave')} ${fmt(g)} · ${t('got')} ${fmt(r)} · ${t('balance')} ${fmt(bal)} (${n} ${t('entries')})`);
  });
  return lines.join('\n');
}

/* ---------- investments: principal, returns, maturity alerts ---------- */
function daysBetween(a, b) {
  const pa = Date.parse(String(a) + 'T00:00:00Z'), pb = Date.parse(String(b) + 'T00:00:00Z');
  if (isNaN(pa) || isNaN(pb)) return null;
  return Math.round((pb - pa) / 86400000);
}
function invInterest(inv) {
  if (!inv.rate || !inv.startDate || !inv.maturityDate) return null;
  const days = daysBetween(inv.startDate, inv.maturityDate);
  if (days === null || days < 0) return null;
  return round2(inv.principal * (inv.rate / 100) * (days / 365));
}
function invStatus(inv) {
  const left = daysBetween(localToday(), inv.maturityDate);
  if (left === null) return { key: 'active', left: null };
  if (left < 0) return { key: 'matured', left };
  if (left <= (inv.remindDays === undefined || inv.remindDays === null ? 7 : inv.remindDays)) return { key: 'soon', left };
  return { key: 'active', left };
}
function maturingSoon() {
  return (state.investments || []).filter(inv => invStatus(inv).key === 'soon');
}
function daysLeftText(n) { return n === 1 ? '1 ' + t('dayLeft') : n + ' ' + t('daysLeft'); }
function renderMaturingAlert() {
  const soon = maturingSoon();
  const text = soon.length
    ? '⚠️ ' + soon.length + ' ' + t('maturingSoon') + ': ' + soon.map(inv => esc(inv.name) + ' (' + daysLeftText(invStatus(inv).left) + ')').join(', ')
    : '';
  $('maturingAlert').innerHTML = text;
  $('investAlert').innerHTML = text;
  $('maturingAlert').classList.toggle('hidden', !(activeTab === 'ledger' && soon.length));
  $('investAlert').classList.toggle('hidden', !(activeTab === 'investments' && soon.length));
}
function updateTabBar() {
  document.querySelectorAll('.tab-btn').forEach(b => {
    const on = b.dataset.tab === activeTab;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  const badge = $('investTabBadge');
  const n = maturingSoon().length;
  badge.textContent = n ? String(n) : '';
  badge.classList.toggle('hidden', !n);
}
function renderInvestments() {
  const list = [...(state.investments || [])].sort((a, b) => (a.maturityDate || '').localeCompare(b.maturityDate || '') || a.name.localeCompare(b.name));
  $('investmentEmpty').classList.toggle('hidden', list.length > 0);
  $('investmentList').innerHTML = list.map(inv => {
    const st = invStatus(inv);
    const interest = invInterest(inv);
    const maturityVal = interest === null ? null : round2(inv.principal + interest);
    const statusLabel = st.key === 'matured' ? t('matured') : st.key === 'soon' ? t('maturingSoon') : t('active');
    const leftText = st.left === null || st.left < 0 ? '' : ' · ' + daysLeftText(st.left);
    const returnText = maturityVal === null ? '' : ' · ' + t('maturityValue') + ': ' + fmt(maturityVal) + ' (' + t('interestEarned') + ' ' + fmt(interest) + ')';
    return `<div class="entry-row">
      <span class="entry-main"><span class="entry-note">${esc(inv.name)}</span><br>
      <span class="entry-meta">${t('principal')}: ${fmt(inv.principal)}${inv.rate ? ' · ' + inv.rate + '%' : ''} · ${t('maturityDate')}: ${displayDate(inv.maturityDate)}${leftText} · ${statusLabel}${returnText}${inv.note ? ' · ' + esc(inv.note) : ''}</span></span>
      ${inv.image ? `<button type="button" class="entry-thumb" data-view-photo="investment:${inv.id}" aria-label="${t('photo')}"><img src="${inv.image}" alt=""></button>` : ''}
      <span class="entry-amt">${fmt(inv.principal)}</span>
      <button type="button" class="entry-edit" data-edit-investment="${inv.id}" aria-label="${t('edit')}">✎</button>
      <button type="button" class="entry-edit" data-delete-investment="${inv.id}" aria-label="${t('delete')}">🗑</button>
      <button type="button" class="entry-edit" data-calendar-investment="${inv.id}" aria-label="${t('calReminder')}" title="${t('calReminder')}">📅</button>
    </div>`;
  }).join('');
}
function calDate(iso) { return String(iso).slice(0, 10).replace(/-/g, ''); }
function addDaysIso(iso, n) {
  const d = new Date(String(iso).slice(0, 10) + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function icsEscape(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
function icsFold(line) { let out = ''; while (line.length > 75) { out += line.slice(0, 75) + '\r\n '; line = line.slice(75); } return out + line; }
function icsText(title, details, day) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Khatabook//EN', 'BEGIN:VEVENT',
    'UID:' + title.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + calDate(day) + '@khatabook', 'DTSTAMP:' + stamp,
    'DTSTART;VALUE=DATE:' + calDate(day), 'DTEND;VALUE=DATE:' + calDate(addDaysIso(day, 1)),
    'SUMMARY:' + icsEscape(title), 'DESCRIPTION:' + icsEscape(details),
    'END:VEVENT', 'END:VCALENDAR'];
  return lines.map(icsFold).join('\r\n');
}
function isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
function isAndroid() { return /Android/.test(navigator.userAgent); }
function openCalendarEvent(title, details, day) {
  const start = calDate(day), end = calDate(addDaysIso(day, 1));
  if (isAndroid()) {
    // Opens the default calendar app (Samsung Calendar, Google Calendar, …)
    // on a prefilled new-event screen. Falls back to Google Calendar web
    // if no calendar app handles the intent.
    const begin = Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10));
    const fallback = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) + '&dates=' + start + '/' + end + '&details=' + encodeURIComponent(details);
    const intent = 'intent:#Intent;action=android.intent.action.INSERT;type=vnd.android.cursor.item/event'
      + ';S.title=' + encodeURIComponent(title)
      + ';S.description=' + encodeURIComponent(details)
      + ';l.beginTime=' + begin + ';l.endTime=' + (begin + 86400000) + ';B.allDay=true'
      + ';S.browser_fallback_url=' + encodeURIComponent(fallback) + ';end';
    toast(t('openingCalendar'));
    location.href = intent;
    return;
  }
  if (isIOS()) {
    // iOS has no calendar intent: a data: .ics opens Apple's own
    // add-event sheet in Calendar — no file lands in Downloads.
    toast(t('openingCalendar'));
    location.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsText(title, details, day));
    return;
  }
  const blob = new Blob([icsText(title, details, day)], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = title.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-reminder.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(t('calFileSaved'));
}
function openInvestmentCalendar(inv) {
  if (!inv.maturityDate) return;
  const remind = inv.remindDays === undefined || inv.remindDays === null ? 7 : inv.remindDays;
  let day = addDaysIso(inv.maturityDate, -remind);
  if (day < localToday()) day = localToday();
  const title = t('calReminderTitle').replace('{name}', inv.name).replace('{date}', displayDate(inv.maturityDate));
  const details = t('principal') + ': ' + fmt(inv.principal) + ' · ' + t('maturityDate') + ': ' + displayDate(inv.maturityDate);
  openCalendarEvent(title, details, day);
}
let editingInvestmentId = null;
function openInvestmentModal(inv) {
  editingInvestmentId = inv ? inv.id : null;
  $('investmentModalTitle').dataset.i18n = inv ? 'editInvestment' : 'addInvestment';
  applyTranslations();
  $('invName').value = inv ? inv.name : '';
  $('invPrincipal').value = inv ? fmtNum(inv.principal) : '';
  $('invRate').value = inv && inv.rate !== undefined && inv.rate !== null ? inv.rate : '';
  $('invStart').value = inv ? (inv.startDate || '') : localToday();
  $('invMaturity').value = inv ? inv.maturityDate : '';
  $('invRemind').value = inv && inv.remindDays !== undefined && inv.remindDays !== null ? inv.remindDays : 7;
  $('invNote').value = inv ? (inv.note || '') : '';
  $('investmentDeleteBtn').classList.toggle('hidden', !editingInvestmentId);
  setPhotoField('inv', inv ? inv.image : null);
  openModal('investmentModal');
  setTimeout(() => $('invName').focus(), 100);
}
$('investmentForm').addEventListener('submit', ev => {
  ev.preventDefault();
  const name = $('invName').value.trim();
  if (!name) { toast(t('enterName')); return; }
  const principal = round2(parseAmount($('invPrincipal').value));
  if (!principal || principal <= 0) { toast(t('enterPrincipal')); return; }
  const rateRaw = ($('invRate').value || '').trim();
  const rateParsed = rateRaw === '' ? NaN : parseFloat(rateRaw);
  const data = {
    name, principal,
    rate: isNaN(rateParsed) ? null : round2(rateParsed),
    startDate: $('invStart').value || '',
    maturityDate: $('invMaturity').value || '',
    remindDays: Math.max(0, parseInt($('invRemind').value, 10) || 0),
    note: $('invNote').value.trim()
  };
  if (editingInvestmentId) {
    const inv = state.investments.find(x => x.id === editingInvestmentId);
    if (inv) { Object.assign(inv, data); applyPhoto(inv, 'inv'); }
    toast(t('investmentUpdated'));
  } else {
    const rec = { id: uid(), ...data }; applyPhoto(rec, 'inv');
    state.investments.push(rec);
    toast(t('investmentAdded'));
  }
  save(); closeModals(); render();
});
$('investmentDeleteBtn').addEventListener('click', () => {
  if (!editingInvestmentId) return;
  if (!confirm(t('confirmDeleteInvestment'))) return;
  state.investments = state.investments.filter(x => x.id !== editingInvestmentId);
  save(); closeModals(); render(); toast(t('investmentDeleted'));
});

/* ---------- payment reminders ---------- */
function fmtIsoParts(y, m, d) { return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }
function addMonthsIso(iso, n) {
  let [y, m, d] = iso.split('-').map(Number);
  m += n; y += Math.floor((m - 1) / 12); m = ((m - 1) % 12) + 1;
  const last = new Date(y, m, 0).getDate();
  return fmtIsoParts(y, m, Math.min(d, last));
}
function addYearsIso(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const last = new Date(y + n, m, 0).getDate();
  return fmtIsoParts(y + n, m, Math.min(d, last));
}
function effectiveDue(r) {
  if (!r.dueDate) return '';
  if (!r.repeat || r.repeat === 'once') return r.dueDate;
  let d = r.dueDate; const today = localToday(); let guard = 0;
  while (d < today && guard++ < 1200) d = r.repeat === 'monthly' ? addMonthsIso(d, 1) : addYearsIso(d, 1);
  return d;
}
function repeatLabel(rep) { return rep === 'monthly' ? t('repeatMonthly') : rep === 'yearly' ? t('repeatYearly') : t('repeatOnce'); }
function renderReminders() {
  const list = [...(state.reminders || [])].sort((a, b) => effectiveDue(a).localeCompare(effectiveDue(b)) || a.title.localeCompare(b.title));
  $('reminderEmpty').classList.toggle('hidden', list.length > 0);
  $('reminderList').innerHTML = list.map(r => {
    const due = effectiveDue(r);
    const left = due ? daysBetween(localToday(), due) : null;
    const leftText = left === null ? '' : left < 0 ? t('overdue') : left === 0 ? t('dueToday') : daysLeftText(left);
    const soon = left !== null && left >= 0 && left <= 7;
    return `<div class="entry-row${soon ? ' due-soon' : ''}">
      <span class="entry-main"><span class="entry-note">${esc(r.title)}</span>
      <span class="entry-meta">${r.amount ? fmt(r.amount) + ' · ' : ''}${displayDate(due)} · ${leftText} · ${repeatLabel(r.repeat)}${r.note ? ' · ' + esc(r.note) : ''}</span></span>
      <button type="button" class="entry-edit" data-edit-reminder="${r.id}" aria-label="${t('edit')}">✎</button>
      <button type="button" class="entry-edit" data-delete-reminder="${r.id}" aria-label="${t('delete')}">🗑</button>
      <button type="button" class="entry-edit" data-calendar-reminder="${r.id}" aria-label="${t('calReminder')}" title="${t('calReminder')}">📅</button>
    </div>`;
  }).join('');
}
function openReminderCalendar(r) {
  const due = effectiveDue(r);
  if (!due) return;
  const details = (r.amount ? t('amount') + ': ' + fmt(r.amount) + ' · ' : '') + t('date') + ': ' + displayDate(due) + (r.note ? ' · ' + r.note : '');
  openCalendarEvent(r.title, details, due);
}
let editingReminderId = null;
function openReminderModal(r) {
  editingReminderId = r ? r.id : null;
  $('reminderModalTitle').dataset.i18n = r ? 'editReminder' : 'addReminder';
  applyTranslations();
  $('remTitle').value = r ? r.title : '';
  $('remAmount').value = r && r.amount !== undefined && r.amount !== null ? fmtNum(r.amount) : '';
  $('remDue').value = r ? r.dueDate : localToday();
  $('remRepeat').value = r ? (r.repeat || 'once') : 'once';
  $('remNote').value = r ? (r.note || '') : '';
  $('reminderDeleteBtn').classList.toggle('hidden', !editingReminderId);
  openModal('reminderModal');
  setTimeout(() => $('remTitle').focus(), 100);
}
$('reminderForm').addEventListener('submit', ev => {
  ev.preventDefault();
  const title = $('remTitle').value.trim();
  if (!title) { toast(t('enterName')); return; }
  const amtRaw = ($('remAmount').value || '').trim();
  const amtParsed = amtRaw === '' ? NaN : parseAmount(amtRaw);
  const data = {
    title,
    amount: isNaN(amtParsed) ? null : round2(amtParsed),
    dueDate: $('remDue').value || localToday(),
    repeat: $('remRepeat').value || 'once',
    note: $('remNote').value.trim()
  };
  if (editingReminderId) {
    const r = state.reminders.find(x => x.id === editingReminderId);
    if (r) Object.assign(r, data);
    toast(t('reminderUpdated'));
  } else {
    state.reminders.push({ id: uid(), ...data });
    toast(t('reminderAdded'));
  }
  save(); closeModals(); render();
});
$('reminderDeleteBtn').addEventListener('click', () => {
  if (!editingReminderId) return;
  if (!confirm(t('confirmDeleteReminder'))) return;
  state.reminders = state.reminders.filter(x => x.id !== editingReminderId);
  save(); closeModals(); render(); toast(t('reminderDeleted'));
});
$('addReminderBtn').addEventListener('click', () => openReminderModal(null));

/* ---------- modals ---------- */
function openModal(id) { $(id).classList.remove('hidden'); }
function closeModals() { document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden')); }
document.querySelectorAll('[data-modal-close]').forEach(b => b.addEventListener('click', closeModals));
document.querySelectorAll('.modal-backdrop').forEach(bd => bd.addEventListener('click', ev => {
  if (ev.target === bd) closeModals();
}));

let editingCustomerId = null;
function openCustomerModal(customer) {
  editingCustomerId = customer ? customer.id : null;
  $('customerModalTitle').dataset.i18n = customer ? 'editCustomer' : 'addCustomer';
  applyTranslations();
  $('custName').value = customer ? customer.name : '';
  $('custPhone').value = customer ? (customer.phone || '') : '';
  $('custEmail').value = customer ? (customer.email || '') : '';
  $('custKbUser').checked = !!(customer && customer.kbUser);
  setPhotoField('cust', customer ? customer.image : null);
  openModal('customerModal');
  setTimeout(() => $('custName').focus(), 100);
}
$('customerForm').addEventListener('submit', ev => {
  ev.preventDefault();
  const name = $('custName').value.trim();
  if (!name) { toast(t('enterName')); return; }
  const phone = $('custPhone').value.trim();
  const email = $('custEmail').value.trim();
  const kbUser = $('custKbUser').checked;
  if (editingCustomerId) {
    const c = state.customers.find(x => x.id === editingCustomerId);
    if (c) { c.name = name; c.phone = phone; c.email = email; c.kbUser = kbUser; applyPhoto(c, 'cust'); }
    toast(t('customerUpdated'));
  } else {
    const rec = { id: uid(), name, phone, email, kbUser }; applyPhoto(rec, 'cust');
    state.customers.push(rec);
    toast(t('customerAdded'));
  }
  save(); closeModals(); render();
});

let editingEntryId = null, entryType = 'gave';
function setEntryType(tp) {
  entryType = tp;
  document.querySelectorAll('input[name="entryType"]').forEach(r => r.checked = r.value === tp);
}
document.querySelectorAll('input[name="entryType"]').forEach(r => r.addEventListener('change', () => { entryType = r.value; }));
function openEntryModal(entry) {
  editingEntryId = entry ? entry.id : null;
  $('entryModalTitle').dataset.i18n = entry ? 'editEntry' : 'addEntry';
  applyTranslations();
  setEntryType(entry ? entry.type : 'gave');
  $('entryAmount').value = entry ? fmtNum(entry.amount) : '';
  $('entryDate').value = entry ? entry.date : localToday();
  $('entryNote').value = entry ? (entry.note || '') : '';
  $('entryDeleteBtn').classList.toggle('hidden', !editingEntryId);
  setPhotoField('entry', entry ? entry.image : null);
  openModal('entryModal');
  setTimeout(() => $('entryAmount').focus(), 100);
}
$('entryForm').addEventListener('submit', ev => {
  ev.preventDefault();
  const amount = round2(parseAmount($('entryAmount').value));
  if (!amount || amount <= 0) { toast(t('enterAmount')); return; }
  const data = { type: entryType, amount, date: $('entryDate').value || localToday(), note: $('entryNote').value.trim() };
  if (editingEntryId) {
    const e = state.entries.find(x => x.id === editingEntryId);
    if (e) { Object.assign(e, data); applyPhoto(e, 'entry'); }
    toast(t('entryUpdated'));
  } else {
    const rec = { id: uid(), customerId: selectedId, _seq: Date.now(), ...data }; applyPhoto(rec, 'entry');
    state.entries.push(rec);
    toast(t('entryAdded'));
  }
  save(); closeModals(); render();
});
$('entryDeleteBtn').addEventListener('click', () => {
  if (!editingEntryId) return;
  if (!confirm(t('confirmDeleteEntry'))) return;
  state.entries = state.entries.filter(e => e.id !== editingEntryId);
  save(); closeModals(); render(); toast(t('entryDeleted'));
});

/* ---------- quick-add entry from the main screen ---------- */
let quickType = 'gave';
function setQuickType(tp) {
  quickType = tp;
  document.querySelectorAll('input[name="quickType"]').forEach(r => r.checked = r.value === tp);
}
document.querySelectorAll('input[name="quickType"]').forEach(r => r.addEventListener('change', () => { quickType = r.value; }));
function openQuickAdd() {
  if (!state.customers.length) { toast(t('addCustomerFirst')); openCustomerModal(null); return; }
  $('quickCustomer').innerHTML = [...state.customers].sort((a, b) => a.name.localeCompare(b.name))
    .map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  setQuickType('gave');
  $('quickAmount').value = '';
  $('quickDate').value = localToday();
  $('quickNote').value = '';
  setPhotoField('quick', null);
  openModal('quickAddModal');
  setTimeout(() => $('quickAmount').focus(), 100);
}
$('quickAddEntryBtn').addEventListener('click', openQuickAdd);
$('quickAddForm').addEventListener('submit', ev => {
  ev.preventDefault();
  const amount = round2(parseAmount($('quickAmount').value));
  if (!amount || amount <= 0) { toast(t('enterAmount')); return; }
  const cid = $('quickCustomer').value;
  if (!state.customers.find(c => c.id === cid)) { toast(t('addCustomerFirst')); return; }
  state.entries.push({ id: uid(), customerId: cid, _seq: Date.now(), type: quickType, amount, date: $('quickDate').value || localToday(), note: $('quickNote').value.trim() });
  applyPhoto(state.entries[state.entries.length - 1], 'quick');
  save(); closeModals(); render(); toast(t('entryAdded'));
});

/* ---------- record photos (customer / entry / investment) ---------- */
const pendingImages = {};
function compressImage(file) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        for (const max of [1024, 768, 512]) {
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          cv.getContext('2d').drawImage(img, 0, 0, w, h);
          const data = cv.toDataURL('image/jpeg', 0.75);
          if (data.length <= 250000) { resolve(data); return; }
        }
      } catch (e) { /* fall through to null */ }
      resolve(null);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}
function showPhotoPreview(prefix, data) {
  $(prefix + 'PhotoImg').src = data || '';
  $(prefix + 'PhotoPreview').classList.toggle('hidden', !data);
}
function setPhotoField(prefix, data) {
  delete pendingImages[prefix];
  $(prefix + 'Photo').value = '';
  showPhotoPreview(prefix, data || null);
}
function applyPhoto(rec, prefix) {
  if (pendingImages[prefix] === undefined) return;
  if (pendingImages[prefix]) rec.image = pendingImages[prefix]; else delete rec.image;
  delete pendingImages[prefix];
}
function wirePhoto(prefix) {
  $(prefix + 'Photo').addEventListener('change', async ev => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const data = await compressImage(file);
    if (!data) { toast(t('photoTooLarge')); ev.target.value = ''; return; }
    if (JSON.stringify(state).length + data.length > 800000) { toast(t('bookTooLarge')); ev.target.value = ''; return; }
    pendingImages[prefix] = data;
    showPhotoPreview(prefix, data);
  });
  $(prefix + 'PhotoRemove').addEventListener('click', () => {
    pendingImages[prefix] = null;
    $(prefix + 'Photo').value = '';
    showPhotoPreview(prefix, null);
  });
}
wirePhoto('cust'); wirePhoto('entry'); wirePhoto('quick'); wirePhoto('inv');

/* ---------- statement + reminder ---------- */
let statementText = '';
function buildStatement(c) {
  const list = state.entries.filter(e => e.customerId === c.id)
    .sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  const rows = list.map(e => {
    running = round2(running + (e.type === 'gave' ? e.amount : -e.amount));
    return { e, running };
  });
  const b = balanceOf(c.id);
  const rowsHtml = rows.length ? rows.map(({ e, running: rb }) =>
    `<div class="stmt-row"><span class="stmt-left">${displayDate(e.date)} · ${e.type === 'gave' ? t('gave') : t('got')}${e.note ? ' · ' + esc(e.note) : ''}</span><span>${fmt(e.amount)} · ${fmt(rb)}</span></div>`
  ).join('') : `<div class="empty">${t('noEntries')}</div>`;
  const rowsText = rows.map(({ e, running: rb }) =>
    `${displayDate(e.date)} | ${e.type === 'gave' ? t('gave') : t('got')} | ${fmt(e.amount)} | ${t('runningBalance')}: ${fmt(rb)}${e.note ? ' | ' + e.note : ''}`
  ).join('\n');
  statementText = `${t('statement')} — ${t('statementFor')} ${c.name}${c.phone ? ' (' + c.phone + ')' : ''}${c.email ? ' · ' + c.email : ''}\n${t('generatedOn')} ${displayDate(localToday())}\n\n${rowsText}\n\n${t('total')}: ${fmt(b)} (${balLabel(b)})`;
  $('statementContent').innerHTML =
    `<div class="stmt-head"><h3>${t('statement')}</h3><div class="stmt-meta">${t('statementFor')} <b>${esc(c.name)}</b>${c.phone ? ' · ' + esc(c.phone) : ''}${c.email ? ' · ' + esc(c.email) : ''}<br>${t('generatedOn')} ${displayDate(localToday())}</div></div>` +
    rowsHtml +
    `<div class="stmt-total"><span>${balLabel(b)}</span><span class="${balClass(b)}">${fmt(b)}</span></div>`;
}
function copyText(text, doneMsg) {
  const done = () => toast(doneMsg);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); done(); } catch (e) {}
  document.body.removeChild(ta);
}
$('statementBtn').addEventListener('click', () => {
  const c = state.customers.find(x => x.id === selectedId);
  if (!c) return;
  buildStatement(c);
  openModal('statementSheet');
});
$('printStatementBtn').addEventListener('click', () => window.print());
$('copyStatementBtn').addEventListener('click', () => copyText(statementText, t('copied')));
$('reminderBtn').addEventListener('click', () => {
  const c = state.customers.find(x => x.id === selectedId);
  if (!c) return;
  const b = balanceOf(c.id);
  if (!(b > 0.004)) return;
  $('reminderText').value = t('reminderText').replace('{name}', c.name).replace('{amount}', fmt(b));
  openModal('reminderModal');
});
$('copyReminderBtn').addEventListener('click', () => copyText($('reminderText').value, t('copied')));

/* ---------- toolbar / navigation / lists ---------- */
$('addCustomerBtn').addEventListener('click', () => openCustomerModal(null));
document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.tab === 'investments') showInvestments();
  else if (b.dataset.tab === 'reports') showReports();
  else if (b.dataset.tab === 'reminders') showReminders();
  else showList();
}));
$('addInvestmentBtn').addEventListener('click', () => openInvestmentModal(null));
$('maturingAlert').addEventListener('click', showInvestments);
$('reportMonth').addEventListener('change', ev => { reportMonth = ev.target.value; renderReports(); });
$('copyReportBtn').addEventListener('click', () => copyText(buildReportText(), t('copied')));
$('printReportBtn').addEventListener('click', () => window.print());
$('editCustomerBtn').addEventListener('click', () => {
  const c = state.customers.find(x => x.id === selectedId);
  if (c) openCustomerModal(c);
});
$('deleteCustomerBtn').addEventListener('click', () => {
  const c = state.customers.find(x => x.id === selectedId);
  if (!c) return;
  if (!confirm(t('confirmDeleteCustomer'))) return;
  state.customers = state.customers.filter(x => x.id !== selectedId);
  state.entries = state.entries.filter(e => e.customerId !== selectedId);
  save(); showList(); render(); toast(t('customerDeleted'));
});
$('addEntryBtn').addEventListener('click', () => openEntryModal(null));
$('backBtn').addEventListener('click', showList);
$('searchInput').addEventListener('input', renderCustomers);
$('sortSelect').addEventListener('change', ev => { sortKey = ev.target.value; renderCustomers(); });
$('duesOnly').addEventListener('change', ev => { duesOnly = ev.target.checked; renderCustomers(); });
$('entryTypeFilter').addEventListener('change', ev => { entryTypeFilter = ev.target.value; renderDetail(); });
$('dateFrom').addEventListener('change', ev => { dateFrom = ev.target.value; renderDetail(); });
$('dateTo').addEventListener('change', ev => { dateTo = ev.target.value; renderDetail(); });
$('clearFiltersBtn').addEventListener('click', () => {
  entryTypeFilter = 'all'; dateFrom = ''; dateTo = '';
  $('entryTypeFilter').value = 'all'; $('dateFrom').value = ''; $('dateTo').value = '';
  renderDetail();
});
document.addEventListener('click', ev => {
  const open = ev.target.closest('[data-open]');
  if (open) { showDetail(open.dataset.open); return; }
  const edit = ev.target.closest('[data-edit-entry]');
  if (edit) {
    const e = state.entries.find(x => x.id === edit.dataset.editEntry);
    if (e) openEntryModal(e);
    return;
  }
  const del = ev.target.closest('[data-delete-entry]');
  if (del) {
    const e = state.entries.find(x => x.id === del.dataset.deleteEntry);
    if (e && confirm(t('confirmDeleteEntry'))) {
      state.entries = state.entries.filter(x => x.id !== e.id);
      save(); render(); toast(t('entryDeleted'));
    }
    return;
  }
  const editInv = ev.target.closest('[data-edit-investment]');
  if (editInv) {
    const inv = state.investments.find(x => x.id === editInv.dataset.editInvestment);
    if (inv) openInvestmentModal(inv);
    return;
  }
  const delInv = ev.target.closest('[data-delete-investment]');
  if (delInv) {
    const inv = state.investments.find(x => x.id === delInv.dataset.deleteInvestment);
    if (inv && confirm(t('confirmDeleteInvestment'))) {
      state.investments = state.investments.filter(x => x.id !== inv.id);
      save(); render(); toast(t('investmentDeleted'));
    }
    return;
  }
  const calInv = ev.target.closest('[data-calendar-investment]');
  if (calInv) {
    const inv = state.investments.find(x => x.id === calInv.dataset.calendarInvestment);
    if (inv) openInvestmentCalendar(inv);
    return;
  }
  const vp = ev.target.closest('[data-view-photo]');
  if (vp) {
    const parts = vp.dataset.viewPhoto.split(':');
    const rec = parts[0] === 'customer' ? state.customers.find(x => x.id === parts[1])
      : parts[0] === 'entry' ? state.entries.find(x => x.id === parts[1])
      : state.investments.find(x => x.id === parts[1]);
    if (rec && rec.image) { $('photoModalImg').src = rec.image; openModal('photoModal'); }
    return;
  }
  const editRem = ev.target.closest('[data-edit-reminder]');
  if (editRem) {
    const r = state.reminders.find(x => x.id === editRem.dataset.editReminder);
    if (r) openReminderModal(r);
    return;
  }
  const delRem = ev.target.closest('[data-delete-reminder]');
  if (delRem) {
    const r = state.reminders.find(x => x.id === delRem.dataset.deleteReminder);
    if (r && confirm(t('confirmDeleteReminder'))) {
      state.reminders = state.reminders.filter(x => x.id !== r.id);
      save(); render(); toast(t('reminderDeleted'));
    }
    return;
  }
  const calRem = ev.target.closest('[data-calendar-reminder]');
  if (calRem) {
    const r = state.reminders.find(x => x.id === calRem.dataset.calendarReminder);
    if (r) openReminderCalendar(r);
    return;
  }
});
document.querySelectorAll('.curr-btn').forEach(b => b.addEventListener('click', () => {
  state.currency = b.dataset.currency;
  save(); render();
}));

/* ---------- export / import ---------- */
$('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'khatabook-backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast(t('exported'));
});
$('importFile').addEventListener('change', ev => {
  const file = ev.target.files[0];
  ev.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !Array.isArray(data.customers) || !Array.isArray(data.entries)) throw new Error('bad file');
      const ids = new Set(data.customers.map(c => c.id));
      state = {
        currency: (data.currency === 'USD' ? 'USD' : 'INR'),
        customers: data.customers,
        entries: data.entries.filter(e => ids.has(e.customerId)),
        investments: Array.isArray(data.investments) ? data.investments : [],
        reminders: Array.isArray(data.reminders) ? data.reminders : []
      };
      selectedId = null;
      save(); showList(); render(); toast(t('imported'));
    } catch (e) { toast(t('importFailed')); }
  };
  reader.readAsText(file);
});

/* ---------- init ---------- */
applyTheme();
applyTranslations();
render();
initAuth();
