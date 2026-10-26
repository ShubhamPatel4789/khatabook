'use strict';
/* Khatabook — bilingual (English / ગુજરાતી) customer ledger.
   Data: one shared Firestore document in the billsplit-a7148 project
   (collection 'khatabook', doc 'kb_main'), synced live like Billsplit.
   Local storage is only an offline cache. UI gate: Google sign-in.
   NOTE: the project's Firestore rules allow the khatabook document only
   to signed-in users, so Google sign-in is a real gate, not just a screen. */

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
    syncOn: '☁️ Cloud sync ON — every device with this app sees the same data, live.',
    syncOff: '☁️ Cloud sync could not connect — data still saves on this device.',
    syncUnavailable: '☁️ Cloud sync unavailable — data is stored on this device only.',
    authNote: 'Note: this is one shared ledger — anyone who opens this app sees the same book.',
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
    enterName: 'Enter a name', enterAmount: 'Enter an amount',
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
    syncOn: '☁️ ક્લાઉડ સિંક ચાલુ છે — આ એપ ધરાવતા બધા ડિવાઇસમાં એક જ ડેટા લાઇવ દેખાશે.',
    syncOff: '☁️ ક્લાઉડ સિંક કનેક્ટ થઈ શક્યું નથી — ડેટા આ ડિવાઇસમાં સાચવાશે.',
    syncUnavailable: '☁️ ક્લાઉડ સિંક ઉપલબ્ધ નથી — ડેટા ફક્ત આ ડિવાઇસમાં જ સ્ટોર થશે.',
    authNote: 'નોંધ: આ એક સહિયારું ખાતું છે — આ એપ ખોલનાર કોઈપણ વ્યક્તિ આ જ ખાતું જોશે.',
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
    enterName: 'નામ લખો', enterAmount: 'રકમ લખો',
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
let state = { currency: 'INR', customers: [], entries: [] };
try {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    const p = JSON.parse(raw);
    if (p && Array.isArray(p.customers) && Array.isArray(p.entries)) {
      state = { currency: (p.currency === 'USD' ? 'USD' : 'INR'), customers: p.customers, entries: p.entries };
    }
  }
} catch (e) {}
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {} schedulePush(); }

/* ---------- Firebase config (same project as Billsplit; separate document) ---------- */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCzleGE2qWif60DXoxaYGA3kqOuv1Xp94Y",
  authDomain: "billsplit-a7148.firebaseapp.com",
  projectId: "billsplit-a7148",
  storageBucket: "billsplit-a7148.firebasestorage.app",
  messagingSenderId: "356199360313",
  appId: "1:356199360313:web:880d18351664af49a3eae8"
};
/* Khatabook document — never the Billsplit households document. */
const KB_COLLECTION = 'khatabook';
const KB_DOC = 'kb_main';
let kbRef = null, lastPushed = '', pushTimer = null, syncStarted = false, pendingPush = false, syncInitDone = false;
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
    state = { currency: (p.currency === 'USD' ? 'USD' : 'INR'), customers: p.customers, entries: p.entries };
    try { localStorage.setItem(LS_KEY, remote); } catch (e) {}
    render();
  } catch (e) { console.warn('Could not apply cloud data', e); }
}
function initSync() {
  if (syncInitDone) return;
  syncInitDone = true;
  const el = $('syncStatus');
  if (!window.firebase) { if (el) el.textContent = t('syncUnavailable'); return; }
  try {
    kbRef = firebase.firestore().collection(KB_COLLECTION).doc(KB_DOC);
    kbRef.onSnapshot(snap => {
      const wasFirst = !syncStarted;
      syncStarted = true;
      if (el) el.textContent = t('syncOn');
      if (!snap.exists) { pushNow(); return; }
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
let auth = null, currentUser = null;
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
      $('authView').classList.add('hidden');
      $('appView').classList.remove('hidden');
      $('userChip').textContent = user.displayName || user.email || '';
      $('userChip').classList.remove('hidden');
      $('signOutBtn').classList.remove('hidden');
      initSync();
      render();
    } else {
      $('authView').classList.remove('hidden');
      $('appView').classList.add('hidden');
      $('userChip').classList.add('hidden');
      $('signOutBtn').classList.add('hidden');
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

function render() {
  document.querySelectorAll('.curr-btn').forEach(b => b.classList.toggle('active', b.dataset.currency === state.currency));
  renderDashboard();
  renderCustomers();
  if (selectedId) renderDetail(); else { $('listView').classList.remove('hidden'); $('detailView').classList.add('hidden'); }
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
      <span class="cust-avatar">${esc(initial)}</span>
      <span class="cust-main"><span class="cust-name">${esc(c.name)}</span>${c.kbUser ? `<span class="kb-badge">${t('kbUser')}</span>` : ''}${c.phone ? `<span class="cust-phone">${esc(c.phone)}</span>` : ''}${c.email ? `<span class="cust-phone">${esc(c.email)}</span>` : ''}</span>
      <span class="cust-bal ${balClass(b)}">${fmt(b)}<small>${balLabel(b)}</small></span>
    </button>`;
  }).join('');
}
function showList() {
  selectedId = null;
  $('listView').classList.remove('hidden');
  $('detailView').classList.add('hidden');
  renderCustomers();
}
function showDetail(id) {
  selectedId = id;
  $('listView').classList.add('hidden');
  $('detailView').classList.remove('hidden');
  renderDetail();
}
function renderDetail() {
  const c = state.customers.find(x => x.id === selectedId);
  if (!c) { showList(); return; }
  const b = balanceOf(c.id);
  $('detailName').textContent = c.name;
  $('detailPhone').textContent = c.phone || '';
  $('detailEmail').textContent = c.email || '';
  $('detailKbBadge').classList.toggle('hidden', !c.kbUser);
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
      <span class="entry-amt">${fmt(e.amount)}</span>
      <button type="button" class="entry-edit" data-edit-entry="${e.id}" aria-label="${t('edit')}">✎</button>
    </div>`;
  }).join('');
}

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
    if (c) { c.name = name; c.phone = phone; c.email = email; c.kbUser = kbUser; }
    toast(t('customerUpdated'));
  } else {
    state.customers.push({ id: uid(), name, phone, email, kbUser });
    toast(t('customerAdded'));
  }
  save(); closeModals(); render();
});

let editingEntryId = null, entryType = 'gave';
function setEntryType(tp) {
  entryType = tp;
  document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.entryType === tp));
}
document.querySelectorAll('.type-btn').forEach(b => b.addEventListener('click', () => setEntryType(b.dataset.entryType)));
function openEntryModal(entry) {
  editingEntryId = entry ? entry.id : null;
  $('entryModalTitle').dataset.i18n = entry ? 'editEntry' : 'addEntry';
  applyTranslations();
  setEntryType(entry ? entry.type : 'gave');
  $('entryAmount').value = entry ? entry.amount : '';
  $('entryDate').value = entry ? entry.date : localToday();
  $('entryNote').value = entry ? (entry.note || '') : '';
  $('entryDeleteBtn').classList.toggle('hidden', !editingEntryId);
  openModal('entryModal');
  setTimeout(() => $('entryAmount').focus(), 100);
}
$('entryForm').addEventListener('submit', ev => {
  ev.preventDefault();
  const amount = round2(parseFloat($('entryAmount').value));
  if (!amount || amount <= 0) { toast(t('enterAmount')); return; }
  const data = { type: entryType, amount, date: $('entryDate').value || localToday(), note: $('entryNote').value.trim() };
  if (editingEntryId) {
    const e = state.entries.find(x => x.id === editingEntryId);
    if (e) Object.assign(e, data);
    toast(t('entryUpdated'));
  } else {
    state.entries.push({ id: uid(), customerId: selectedId, _seq: Date.now(), ...data });
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
        entries: data.entries.filter(e => ids.has(e.customerId))
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
