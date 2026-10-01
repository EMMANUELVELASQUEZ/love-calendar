/* ── Love Calendar — App JS ───────────────────────────────── */
'use strict';

const API = 'api.php';

// ── State ────────────────────────────────────────────────────
let state = {
  currentYear:  new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1,
  events:       {},   // keyed by 'YYYY-MM-DD'
  editingId:    null,
  selectedDate: null,
};

const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

// ── API helpers ──────────────────────────────────────────────
async function apiFetch(action, opts = {}) {
  const url = `${API}?action=${action}`;
  const res  = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  return res.json();
}

async function getEvents(year, month) {
  const data = await apiFetch(`get_events&year=${year}&month=${month}`);
  state.events = {};
  (data || []).forEach(ev => {
    if (!state.events[ev.date]) state.events[ev.date] = [];
    state.events[ev.date].push(ev);
  });
}

async function getDayEvents(date) {
  return apiFetch(`get_day_events&date=${date}`);
}

// ── Calendar Render ──────────────────────────────────────────
function renderCalendar() {
  const { currentYear: y, currentMonth: m } = state;
  document.getElementById('monthName').textContent = MONTHS_ES[m - 1];
  document.getElementById('yearBadge').textContent = y;

  const grid      = document.getElementById('daysGrid');
  const firstDay  = new Date(y, m - 1, 1).getDay();  // 0=Sun
  const daysInMon = new Date(y, m, 0).getDate();
  const today     = new Date();
  const todayStr  = fmtDate(today);

  grid.innerHTML = '';

  // Leading empty cells
  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'day-cell empty';
    grid.appendChild(el);
  }

  for (let d = 1; d <= daysInMon; d++) {
    const dateStr = `${y}-${pad(m)}-${pad(d)}`;
    const dayDate = new Date(y, m - 1, d);
    const dow     = dayDate.getDay();

    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (dateStr === todayStr)     cell.classList.add('today');
    if (dow === 0 || dow === 6)   cell.classList.add('weekend');
    if (state.events[dateStr])    cell.classList.add('has-events');

    const numEl = document.createElement('span');
    numEl.className = 'day-num';
    numEl.textContent = d;
    cell.appendChild(numEl);

    if (state.events[dateStr]) {
      const dots = document.createElement('div');
      dots.className = 'event-dots';
      state.events[dateStr].slice(0, 3).forEach(ev => {
        const dot = document.createElement('span');
        dot.className = 'event-dot';
        dot.style.background = ev.color || '#e94d7f';
        dots.appendChild(dot);
      });
      cell.appendChild(dots);
    }

    cell.addEventListener('click', () => openDayModal(dateStr));
    grid.appendChild(cell);
  }

  renderTodayStrip(todayStr);
}

// ── Today Strip ──────────────────────────────────────────────
function renderTodayStrip(todayStr) {
  const strip     = document.getElementById('stripEvents');
  const stripDate = document.getElementById('stripDate');

  const today = new Date();
  stripDate.textContent = today.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  const evs = state.events[todayStr] || [];
  strip.innerHTML = '';

  if (evs.length === 0) {
    strip.innerHTML = '<div class="empty-day"><span>✨</span><p>Sin eventos hoy</p></div>';
    return;
  }

  evs.forEach(ev => strip.appendChild(buildEventItem(ev)));
}

function buildEventItem(ev) {
  const item = document.createElement('div');
  item.className = 'event-item';
  item.style.borderLeftColor = ev.color || '#e94d7f';
  item.innerHTML = `
    <span class="event-emoji">${ev.emoji || '❤️'}</span>
    <div class="event-info">
      <div class="event-title">${esc(ev.title)}</div>
      <div class="event-meta">${ev.time ? `${ev.time} · ` : ''}${ev.date}</div>
    </div>
    <span class="event-cat-badge">${catLabel(ev.category)}</span>
  `;
  item.addEventListener('click', () => openEditModal(ev));
  return item;
}

// ── Day Modal ────────────────────────────────────────────────
async function openDayModal(dateStr) {
  state.selectedDate = dateStr;
  const evs  = await getDayEvents(dateStr);
  const d    = new Date(dateStr + 'T00:00:00');
  const list = document.getElementById('dayEventsList');
  const title = document.getElementById('dayModalTitle');

  title.textContent = d.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long'
  }) + ' 📅';

  list.innerHTML = '';
  if (!evs || evs.length === 0) {
    list.innerHTML = '<div class="day-empty-msg"><span>💫</span>No hay eventos este día</div>';
  } else {
    evs.forEach(ev => {
      const row = document.createElement('div');
      row.className = 'day-event-row';
      row.innerHTML = `
        <span class="day-event-row-emoji">${ev.emoji || '❤️'}</span>
        <div class="day-event-row-info">
          <div class="day-event-row-title">${esc(ev.title)}</div>
          ${ev.description ? `<div class="day-event-row-desc">${esc(ev.description)}</div>` : ''}
        </div>
        <div class="day-event-row-actions">
          <button class="btn-icon edit" title="Editar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn-icon delete" title="Eliminar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
            </svg>
          </button>
        </div>
      `;
      row.querySelector('.btn-icon.edit').addEventListener('click', e => {
        e.stopPropagation(); closeModal('dayModal'); openEditModal(ev);
      });
      row.querySelector('.btn-icon.delete').addEventListener('click', async e => {
        e.stopPropagation();
        if (confirm(`¿Eliminar "${ev.title}"?`)) {
          await apiFetch(`delete_event&id=${ev.id}`);
          await refreshEvents(); closeModal('dayModal'); toast('Evento eliminado 💔');
        }
      });
      list.appendChild(row);
    });
  }

  openModal('dayModal');
}

// ── Event Modal (add / edit) ─────────────────────────────────
function openAddModal(date = null) {
  state.editingId = null;
  document.getElementById('eventModalTitle').textContent = 'Nuevo Evento ✨';
  document.getElementById('eventSubmitLabel').textContent = 'Guardar';
  document.getElementById('deleteEventBtn').style.display = 'none';
  document.getElementById('eventId').value = '';
  document.getElementById('eventTitle').value = '';
  document.getElementById('eventDate').value = date || fmtDate(new Date());
  document.getElementById('eventTime').value = '';
  document.getElementById('eventDesc').value = '';

  setCatActive('love');
  openModal('eventModal');
}

function openEditModal(ev) {
  state.editingId = ev.id;
  document.getElementById('eventModalTitle').textContent = 'Editar Evento ✏️';
  document.getElementById('eventSubmitLabel').textContent = 'Actualizar';
  document.getElementById('deleteEventBtn').style.display = '';
  document.getElementById('eventId').value = ev.id;
  document.getElementById('eventTitle').value = ev.title;
  document.getElementById('eventDate').value = ev.date;
  document.getElementById('eventTime').value = ev.time || '';
  document.getElementById('eventDesc').value = ev.description || '';

  setCatActive(ev.category || 'love');
  openModal('eventModal');
}

function setCatActive(cat) {
  document.querySelectorAll('.cat-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === cat);
  });
}

// ── Form Submit ──────────────────────────────────────────────
document.getElementById('eventForm').addEventListener('submit', async e => {
  e.preventDefault();
  const activeCat = document.querySelector('.cat-btn.active');
  const payload = {
    title:       document.getElementById('eventTitle').value.trim(),
    date:        document.getElementById('eventDate').value,
    time:        document.getElementById('eventTime').value || null,
    description: document.getElementById('eventDesc').value.trim() || null,
    category:    activeCat?.dataset.cat   || 'love',
    emoji:       activeCat?.dataset.emoji || '❤️',
    color:       activeCat?.dataset.color || '#e94d7f',
  };

  const id = document.getElementById('eventId').value;
  if (id) {
    payload.id = parseInt(id);
    await apiFetch('update_event', { method: 'POST', body: JSON.stringify(payload) });
    toast('Evento actualizado 💖');
  } else {
    await apiFetch('add_event', { method: 'POST', body: JSON.stringify(payload) });
    toast('Evento guardado 💖');
  }

  closeModal('eventModal');
  await refreshEvents();
});

document.getElementById('deleteEventBtn').addEventListener('click', async () => {
  const id = document.getElementById('eventId').value;
  if (id && confirm('¿Eliminar este evento?')) {
    await apiFetch(`delete_event&id=${id}`);
    closeModal('eventModal');
    await refreshEvents();
    toast('Evento eliminado 💔');
  }
});

// ── Note Form ────────────────────────────────────────────────
document.getElementById('noteForm').addEventListener('submit', async e => {
  e.preventDefault();
  const activeMood = document.querySelector('.mood-btn.active');
  const payload = {
    title:   document.getElementById('noteTitle').value.trim(),
    content: document.getElementById('noteContent').value.trim(),
    date:    fmtDate(new Date()),
    mood:    activeMood?.dataset.mood || 'happy',
  };
  await apiFetch('add_note', { method: 'POST', body: JSON.stringify(payload) });
  closeModal('noteModal');
  document.getElementById('noteForm').reset();
  document.querySelectorAll('.mood-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  await loadNotes();
  toast('Nota guardada 💌');
});

// ── Load Notes ───────────────────────────────────────────────
async function loadNotes() {
  const notes = await apiFetch('get_notes');
  const grid  = document.getElementById('notesGrid');
  grid.innerHTML = '';

  if (!notes || notes.length === 0) {
    grid.innerHTML = '<div class="notes-empty"><span>🌹</span><p>Escribe tu primera nota de amor</p></div>';
    return;
  }

  notes.forEach(n => {
    const moodMap = { happy:'😊', love:'🥰', excited:'🎉', nostalgic:'🌙' };
    const card = document.createElement('div');
    card.className = 'note-card';
    card.innerHTML = `
      <div class="note-card-header">
        <span class="note-mood-icon">${moodMap[n.mood] || '💌'}</span>
        <span class="note-title">${esc(n.title)}</span>
        <button class="note-delete" data-id="${n.id}" title="Eliminar">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      ${n.content ? `<p class="note-content">${esc(n.content)}</p>` : ''}
      <div class="note-footer">${formatDate(n.created_at)}</div>
    `;
    card.querySelector('.note-delete').addEventListener('click', async () => {
      if (confirm('¿Eliminar esta nota?')) {
        await apiFetch(`delete_note&id=${n.id}`);
        await loadNotes();
        toast('Nota eliminada');
      }
    });
    grid.appendChild(card);
  });
}

// ── Modal helpers ────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(ov => {
  ov.addEventListener('click', e => { if (e.target === ov) closeModal(ov.id); });
});

document.getElementById('closeEventModal').addEventListener('click', () => closeModal('eventModal'));
document.getElementById('cancelEventBtn').addEventListener('click',  () => closeModal('eventModal'));
document.getElementById('closeDayModal').addEventListener('click',   () => closeModal('dayModal'));
document.getElementById('closeNoteModal').addEventListener('click',  () => closeModal('noteModal'));
document.getElementById('cancelNoteBtn').addEventListener('click',   () => closeModal('noteModal'));

document.getElementById('btnAddEvent').addEventListener('click', () => openAddModal());
document.getElementById('btnAddNote').addEventListener('click',  () => openModal('noteModal'));

document.getElementById('btnAddInDay').addEventListener('click', () => {
  const d = state.selectedDate;
  closeModal('dayModal');
  openAddModal(d);
});

// Month navigation
document.getElementById('prevMonth').addEventListener('click', async () => {
  if (--state.currentMonth < 1) { state.currentMonth = 12; state.currentYear--; }
  await refreshEvents();
});
document.getElementById('nextMonth').addEventListener('click', async () => {
  if (++state.currentMonth > 12) { state.currentMonth = 1; state.currentYear++; }
  await refreshEvents();
});

// Category buttons
document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Mood buttons
document.querySelectorAll('.mood-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// ── Refresh ──────────────────────────────────────────────────
async function refreshEvents() {
  await getEvents(state.currentYear, state.currentMonth);
  renderCalendar();
}

// ── Toast ────────────────────────────────────────────────────
function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2400);
}

// ── Particles ────────────────────────────────────────────────
function spawnParticles() {
  const container = document.getElementById('particles');
  const hearts = ['❤️','💖','💕','🌹','✨','💗','💓'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle heart';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      --dur: ${6 + Math.random() * 8}s;
      --delay: ${Math.random() * 10}s;
      --size: ${9 + Math.random() * 8}px;
    `;
    p.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    container.appendChild(p);
  }
}

// ── Utilities ────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0'); }
function fmtDate(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function catLabel(cat) {
  const map = { love:'Amor', anniversary:'Aniversario', birthday:'Cumpleaños',
                date:'Cita', special:'Especial', important:'Importante' };
  return map[cat] || cat;
}
function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' });
}

// ── Init ─────────────────────────────────────────────────────
(async function init() {
  spawnParticles();
  await refreshEvents();
  await loadNotes();
})();
