// ── THEME TOGGLE ──
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');
const root        = document.documentElement;

if (localStorage.getItem('busgo-theme') === 'light') {
  root.setAttribute('data-theme', 'light');
  themeIcon.textContent = '☀️';
}

themeToggle.addEventListener('click', () => {
  const isLight = root.getAttribute('data-theme') === 'light';
  if (isLight) {
    root.removeAttribute('data-theme');
    themeIcon.textContent = '🌙';
    localStorage.setItem('busgo-theme', 'dark');
  } else {
    root.setAttribute('data-theme', 'light');
    themeIcon.textContent = '☀️';
    localStorage.setItem('busgo-theme', 'light');
  }
});

// ── CITIES DATA ──
const CITIES = [
  { name: 'Tunis',      region: 'Grand Tunis' },
  { name: 'Sfax',       region: 'Sfax' },
  { name: 'Sousse',     region: 'Sahel' },
  { name: 'Bizerte',    region: 'Nord' },
  { name: 'Gabès',      region: 'Sud' },
  { name: 'Kairouan',   region: 'Centre' },
  { name: 'Monastir',   region: 'Sahel' },
  { name: 'Gafsa',      region: 'Sud-Ouest' },
  { name: 'Nabeul',     region: 'Cap Bon' },
  { name: 'Médenine',   region: 'Sud-Est' },
  { name: 'Tataouine',  region: 'Sud-Est' },
  { name: 'Tozeur',     region: 'Sud-Ouest' },
  { name: 'Hammamet',   region: 'Cap Bon' },
  { name: 'Djerba',     region: 'Sud-Est' },
  { name: 'Kasserine',  region: 'Centre-Ouest' },
  { name: 'Béja',       region: 'Nord-Ouest' },
  { name: 'Jendouba',   region: 'Nord-Ouest' },
  { name: 'Le Kef',     region: 'Nord-Ouest' },
  { name: 'Siliana',    region: 'Nord-Ouest' },
  { name: 'Zaghouan',   region: 'Nord-Est' },
];

// ── STATE ──
const pax = { adult: 1, kid: 0, disabled: 0 };

// ── DEFAULT DATE ──
const todayInput = document.getElementById('travel-date');
const today = new Date();
todayInput.value = today.toISOString().split('T')[0];
todayInput.min   = today.toISOString().split('T')[0];

// ── PASSENGER DROPDOWN ──
const paxTrigger = document.getElementById('paxTrigger');
const paxPanel   = document.getElementById('paxPanel');

paxTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = paxPanel.classList.toggle('open');
  paxTrigger.classList.toggle('open', isOpen);
});

document.addEventListener('click', (e) => {
  if (!paxTrigger.contains(e.target) && !paxPanel.contains(e.target)) {
    paxPanel.classList.remove('open');
    paxTrigger.classList.remove('open');
  }
});

paxPanel.addEventListener('click', (e) => e.stopPropagation());

// ── PAX SUMMARY ──
function updateSummary() {
  const parts = [];
  if (pax.adult)    parts.push(`${pax.adult} Adult${pax.adult > 1 ? 's' : ''}`);
  if (pax.kid)      parts.push(`${pax.kid} Child${pax.kid > 1 ? 'ren' : ''}`);
  if (pax.disabled) parts.push(`${pax.disabled} Disabled`);
  document.getElementById('paxSummary').textContent = parts.join(', ') || '0 Passengers';
}

// Global function for HTML buttons
function updatePax(type, delta) {
  pax[type] = Math.max(0, pax[type] + delta);
  const total = pax.adult + pax.kid + pax.disabled;
  if (total === 0) { pax.adult = 1; }
  document.getElementById(`${type}-count`).textContent = pax[type];
  syncMinusButtons();
  updateSummary();

  // Auto‑refresh prices if there is an active route displayed
  if (allCards.length > 0) {
    refreshPrices();
    renderPage();
  }
}

function syncMinusButtons() {
  const total = pax.adult + pax.kid + pax.disabled;
  document.getElementById('adult-minus').disabled    = pax.adult === 0 || (total === 1 && pax.adult === 1);
  document.getElementById('kid-minus').disabled      = pax.kid === 0;
  document.getElementById('disabled-minus').disabled = pax.disabled === 0;
}
syncMinusButtons();

// ── AUTOCOMPLETE ──
function setupAutocomplete(inputId, suggestionsId) {
  const input = document.getElementById(inputId);
  const list  = document.getElementById(suggestionsId);
  let highlighted = -1;

  function getMatches(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return CITIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q)
    ).slice(0, 6);
  }

  function highlightMatch(text, query) {
    const q = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!q) return text;
    return text.replace(new RegExp(`(${q})`, 'gi'), '<mark>$1</mark>');
  }

  function renderList(matches, query) {
    if (!matches.length) { closeList(); return; }
    highlighted = -1;
    list.innerHTML = matches.map((c, i) => `<li data-value="${c.name}" data-index="${i}"><span class="sug-icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="var(--amber)"><path d="M12 2C8.686 2 6 4.686 6 8c0 4.418 6 12 6 12s6-7.582 6-12c0-3.314-2.686-6-6-6z"/></svg></span><span class="sug-name">${highlightMatch(c.name, query)}</span><span class="sug-sub">${c.region}</span></li>`).join('');
    list.classList.add('open');
  }

  function closeList() {
    list.classList.remove('open');
    list.innerHTML = '';
    highlighted = -1;
  }

  function selectItem(value) {
    input.value = value;
    closeList();
  }

  input.addEventListener('input', () => {
    renderList(getMatches(input.value), input.value);
  });

  input.addEventListener('focus', () => {
    if (input.value) renderList(getMatches(input.value), input.value);
  });

  input.addEventListener('keydown', (e) => {
    const items = list.querySelectorAll('li');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlighted = Math.min(highlighted + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlighted = Math.max(highlighted - 1, 0);
    } else if (e.key === 'Enter') {
      if (highlighted >= 0) {
        e.preventDefault();
        selectItem(items[highlighted].dataset.value);
      }
      return;
    } else if (e.key === 'Escape') {
      closeList(); return;
    } else { return; }

    items.forEach(el => el.classList.remove('highlighted'));
    items[highlighted]?.classList.add('highlighted');
    items[highlighted]?.scrollIntoView({ block: 'nearest' });
  });

  list.addEventListener('mousedown', (e) => {
    const li = e.target.closest('li');
    if (li) { e.preventDefault(); selectItem(li.dataset.value); }
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !list.contains(e.target)) closeList();
  });
}

setupAutocomplete('from', 'from-suggestions');
setupAutocomplete('to',   'to-suggestions');

// ── SWITCH BUTTON (with auto‑search) ──
const switchBtn = document.getElementById('switchBtn');
switchBtn.addEventListener('click', () => {
  const fromInput = document.getElementById('from');
  const toInput   = document.getElementById('to');
  
  // Swap values
  const tmp = fromInput.value;
  fromInput.value = toInput.value;
  toInput.value   = tmp;
  
  // Add spin animation
  switchBtn.classList.add('spinning');
  setTimeout(() => switchBtn.classList.remove('spinning'), 400);
  
  // Auto‑search if both fields are filled and different
  const newFrom = fromInput.value.trim();
  const newTo   = toInput.value.trim();
  if (newFrom && newTo && newFrom.toLowerCase() !== newTo.toLowerCase()) {
    doSearch();
  }
});

// ── PAGINATION STATE ──
const PAGE_SIZE = 4;
let currentPage = 1;
let allCards    = [];
let lastFrom    = '';
let lastTo      = '';
let lastDate    = '';

// ── SEARCH ──
document.getElementById('searchBtn').addEventListener('click', doSearch);

async function doSearch() {
  const from = document.getElementById('from').value.trim();
  const to   = document.getElementById('to').value.trim();
  const date = document.getElementById('travel-date').value;
  const resultsEl = document.getElementById('results');

  if (!from || !to) {
    resultsEl.innerHTML = `<div class="no-results"><span class="emoji">⚠️</span><p>Please select both a departure and arrival city.</p></div>`;
    return;
  }
  if (from.toLowerCase() === to.toLowerCase()) {
    resultsEl.innerHTML = `<div class="no-results"><span class="emoji">🤔</span><p>Departure and arrival cities must be different.</p></div>`;
    return;
  }

  resultsEl.innerHTML = `<div class="empty-state"><span class="emoji">⏳</span><p>Searching available buses…</p></div>`;

  let data;
  try {
    const resp = await fetch('bus-data.json');
    data = await resp.json();
  } catch (e) {
    resultsEl.innerHTML = `<div class="no-results"><span class="emoji">❌</span><p>Could not load schedule data.</p></div>`;
    return;
  }

  const route = data.routes.find(r =>
    r.from.toLowerCase() === from.toLowerCase() &&
    r.to.toLowerCase()   === to.toLowerCase()
  );

  if (!route) {
    resultsEl.innerHTML = `<div class="no-results"><span class="emoji">😕</span><p>No direct routes found from <strong>${from}</strong> to <strong>${to}</strong>.</p></div>`;
    return;
  }

  lastFrom = from;
  lastTo   = to;
  lastDate = date
    ? new Date(date + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  allCards = [];
  for (const provider of route.providers) {
    for (const sched of provider.schedules) {
      allCards.push({ provider, sched, totalPrice: calcTotal(sched.price) });
    }
  }
  allCards.sort((a, b) => a.sched.departure.localeCompare(b.sched.departure));

  currentPage = 1;
  renderPage();
}

function calcTotal(price) {
  return (pax.adult * price.adult) + (pax.kid * price.kid) + (pax.disabled * price.disabled);
}

// Recalculate total prices based on current passenger counts
function refreshPrices() {
  allCards.forEach(card => {
    card.totalPrice = calcTotal(card.sched.price);
  });
  // (Optional) keep the same departure time order
}

function renderPage() {
  const totalPages = Math.ceil(allCards.length / PAGE_SIZE);
  const start      = (currentPage - 1) * PAGE_SIZE;
  const pageCards  = allCards.slice(start, start + PAGE_SIZE);
  const resultsEl  = document.getElementById('results');

  resultsEl.innerHTML = `
    <div class="results-header">
      Available buses
      <span class="count-badge">${allCards.length} results</span>
      <span style="margin-left:auto;font-family:var(--font-body);text-transform:none;letter-spacing:0;color:var(--muted);font-size:.78rem;font-weight:400">
        ${lastFrom} → ${lastTo} · ${lastDate}
      </span>
    </div>
    ${pageCards.map(buildCard).join('')}
    ${totalPages > 1 ? buildPagination(totalPages) : ''}
  `;

  resultsEl.querySelectorAll('.page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      renderPage();
      window.scrollTo({ top: resultsEl.offsetTop - 20, behavior: 'smooth' });
    });
  });
}

function buildPagination(totalPages) {
  const show   = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1].filter(p => p >= 1 && p <= totalPages));
  const sorted = [...show].sort((a, b) => a - b);

  let html = `<div class="pagination">`;

  html += `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
  </button>`;

  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) {
      html += `<span class="page-ellipsis">…</span>`;
    }
    html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
  });

  html += `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  </button>`;

  html += `</div>`;
  return html;
}

function buildCard({ provider, sched, totalPrice }) {
  const [intPart, decPart] = totalPrice.toFixed(2).split('.');
  return `
    <div class="ticket">
      <div class="ticket-info">
        <div class="ticket-top">
          <div class="stop-time">${sched.departure}</div>
          <div class="trip-middle">
            <div class="duration-value">${sched.duration}</div>
            <div class="route-line">
              <div class="dot"></div>
              <div class="line-seg"></div>
              <div class="dot"></div>
            </div>
          </div>
          <div class="stop-time">${sched.arrival}</div>
        </div>
        <div class="ticket-bottom">
          <span class="stop-city">${lastFrom}</span>
          <div class="provider-chip">
            <span class="chip-icon">${provider.logo}</span>
            <span>${provider.name}</span>
          </div>
          <span class="stop-city-arr">${lastTo}</span>
        </div>
      </div>
      <div class="trip-price">
        <span class="price-total">${intPart}.${decPart}</span>
        <span class="price-currency">TND</span>
      </div>
    </div>
  `;
}