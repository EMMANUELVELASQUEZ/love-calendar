/* ── Love Calendar — App JS ───────────────────────────────── */
'use strict';

const API = 'api.php';

// ── Vibration Patterns ───────────────────────────────────────
const VIBRATE = {
  gentle:      [100, 50, 100],
  event:       [150, 75, 150],
  love:        [100, 50, 100, 50, 300],
  anniversary: [200, 100, 200, 100, 500],
  birthday:    [150, 75, 150, 75, 300],
  holiday:     [200, 100, 200, 100, 200],
  celebrate:   [100, 50, 100, 50, 100, 50, 500],
  welcome:     [100, 50, 200, 50, 300],
};

function vibrate(pattern) {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(pattern); } catch (_) {}
  }
}

// ── State ────────────────────────────────────────────────────
let state = {
  currentYear:  new Date().getFullYear(),
  currentMonth: new Date().getMonth() + 1,
  events:       {},
  editingId:    null,
  selectedDate: null,
  swRegistration: null,
  pushSubscription: null,
};

const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

// Mexican holidays client-side (for calendar highlighting + day modal)
const HOLIDAYS_CLIENT = {
  '01-01': { title: '🎊 Año Nuevo',                emoji: '🎊', color: '#f7a52b' },
  '02-05': { title: '🇲🇽 Día de la Constitución',  emoji: '🇲🇽', color: '#2980b9' },
  '02-14': { title: '💕 San Valentín',              emoji: '💕', color: '#e94d7f' },
  '03-08': { title: '🌷 Día de la Mujer',           emoji: '🌷', color: '#9b59b6' },
  '03-21': { title: '🦅 Natalicio de Juárez',       emoji: '🦅', color: '#2980b9' },
  '04-30': { title: '👶 Día del Niño',              emoji: '👶', color: '#f7a52b' },
  '05-01': { title: '💪 Día del Trabajo',           emoji: '💪', color: '#27ae60' },
  '05-10': { title: '🌸 Día de las Madres',         emoji: '🌸', color: '#e94d7f' },
  '09-15': { title: '🎉 Víspera de Independencia',  emoji: '🎉', color: '#c41e8f' },
  '09-16': { title: '🇲🇽 Independencia de México',  emoji: '🇲🇽', color: '#27ae60' },
  '10-31': { title: '🎃 Halloween',                 emoji: '🎃', color: '#f7a52b' },
  '11-01': { title: '🌼 Día de Todos Santos',       emoji: '🌼', color: '#9b59b6' },
  '11-02': { title: '💀 Día de Muertos',            emoji: '💀', color: '#9b59b6' },
  '11-20': { title: '🇲🇽 Día de la Revolución',     emoji: '🇲🇽', color: '#2980b9' },
  '12-12': { title: '🙏 Virgen de Guadalupe',       emoji: '🙏', color: '#c41e8f' },
  '12-24': { title: '🎄 Nochebuena',                emoji: '🎄', color: '#27ae60' },
  '12-25': { title: '🎅 Navidad',                   emoji: '🎅', color: '#e94d7f' },
  '12-31': { title: '🥂 Fin de Año',                emoji: '🥂', color: '#d4a843' },
};

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
  const firstDay  = new Date(y, m - 1, 1).getDay();
  const daysInMon = new Date(y, m, 0).getDate();
  const today     = new Date();
  const todayStr  = fmtDate(today);

  grid.innerHTML = '';

  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'day-cell empty';
    grid.appendChild(el);
  }

  for (let d = 1; d <= daysInMon; d++) {
    const dateStr = `${y}-${pad(m)}-${pad(d)}`;
    const dow     = new Date(y, m - 1, d).getDay();
    const mmdd    = `${pad(m)}-${pad(d)}`;
    const holiday = HOLIDAYS_CLIENT[mmdd];

    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (dateStr === todayStr)   cell.classList.add('today');
    if (dow === 0 || dow === 6) cell.classList.add('weekend');
    if (state.events[dateStr])  cell.classList.add('has-events');
    if (holiday)                cell.classList.add('has-holiday');

    const numEl = document.createElement('span');
    numEl.className = 'day-num';
    numEl.textContent = d;
    cell.appendChild(numEl);

    if (holiday) {
      const hEl = document.createElement('span');
      hEl.className = 'day-holiday-dot';
      hEl.textContent = holiday.emoji;
      cell.appendChild(hEl);
    } else if (state.events[dateStr]) {
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

    cell.addEventListener('click', () => {
      vibrate(VIBRATE.gentle);
      openDayModal(dateStr);
    });
    grid.appendChild(cell);
  }

  renderTodayStrip(todayStr);
  checkTodayHoliday();
}

// ── Today Holiday Banner ─────────────────────────────────────
function checkTodayHoliday() {
  const today = new Date();
  const mmdd  = `${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const h     = HOLIDAYS_CLIENT[mmdd];
  const strip = document.getElementById('holidayStrip');

  if (h) {
    document.getElementById('holidayEmoji').textContent = h.emoji;
    document.getElementById('holidayTitle').textContent = h.title;
    document.getElementById('holidayDesc').textContent  = '¡Hoy es un día especial!';
    strip.style.display = '';
    strip.style.borderColor = h.color + '55';
    // Vibrate on holiday day
    setTimeout(() => vibrate(VIBRATE.holiday), 800);
  } else {
    strip.style.display = 'none';
  }

  document.getElementById('holidayVibrateBtn')?.addEventListener('click', () => {
    vibrate(VIBRATE.celebrate);
    toast('¡Vamos a celebrar! 🎉');
  });
}

// ── Today Strip ──────────────────────────────────────────────
function renderTodayStrip(todayStr) {
  const strip = document.getElementById('stripEvents');
  const date  = document.getElementById('stripDate');

  date.textContent = new Date().toLocaleDateString('es-MX', {
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
  item.addEventListener('click', () => { vibrate(VIBRATE.gentle); openEditModal(ev); });
  return item;
}

// ── Day Modal ────────────────────────────────────────────────
async function openDayModal(dateStr) {
  state.selectedDate = dateStr;
  const evs   = await getDayEvents(dateStr);
  const d     = new Date(dateStr + 'T00:00:00');
  const list  = document.getElementById('dayEventsList');
  const title = document.getElementById('dayModalTitle');
  const mmdd  = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const h     = HOLIDAYS_CLIENT[mmdd];

  title.textContent = d.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long'
  }) + ' 📅';

  const banner = document.getElementById('dayHolidayBanner');
  if (h) {
    banner.style.display = '';
    banner.innerHTML = `<span>${h.emoji}</span><strong>${h.title}</strong>`;
    banner.style.borderColor = (h.color || '#e94d7f') + '66';
  } else {
    banner.style.display = 'none';
  }

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
          vibrate(VIBRATE.gentle);
          await apiFetch(`delete_event&id=${ev.id}`);
          await refreshEvents(); closeModal('dayModal'); toast('Evento eliminado 💔');
        }
      });
      list.appendChild(row);
    });
  }

  openModal('dayModal');
}

// ── Event Modal ──────────────────────────────────────────────
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
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
}

// ── Form Submit ──────────────────────────────────────────────
document.getElementById('eventForm').addEventListener('submit', async e => {
  e.preventDefault();
  const activeCat = document.querySelector('.cat-btn.active');
  const payload   = {
    title:       document.getElementById('eventTitle').value.trim(),
    date:        document.getElementById('eventDate').value,
    time:        document.getElementById('eventTime').value || null,
    description: document.getElementById('eventDesc').value.trim() || null,
    category:    activeCat?.dataset.cat   || 'love',
    emoji:       activeCat?.dataset.emoji || '❤️',
    color:       activeCat?.dataset.color || '#e94d7f',
  };

  const id = document.getElementById('eventId').value;
  vibrate(VIBRATE.event);

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
    vibrate(VIBRATE.gentle);
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
  const payload    = {
    title:   document.getElementById('noteTitle').value.trim(),
    content: document.getElementById('noteContent').value.trim(),
    date:    fmtDate(new Date()),
    mood:    activeMood?.dataset.mood || 'happy',
  };
  vibrate(VIBRATE.love);
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

  const moodMap = { happy:'😊', love:'🥰', excited:'🎉', nostalgic:'🌙' };
  notes.forEach(n => {
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
        vibrate(VIBRATE.gentle);
        await apiFetch(`delete_note&id=${n.id}`);
        await loadNotes();
        toast('Nota eliminada');
      }
    });
    grid.appendChild(card);
  });
}

// ── Push Notifications ───────────────────────────────────────
async function initPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push no soportado en este navegador');
    return;
  }

  try {
    // Register service worker
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    state.swRegistration = reg;
    console.log('SW registrado:', reg.scope);

    updateNotifyStatusIcon();

    // Check existing subscription
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      state.pushSubscription = existing;
      updateNotifyStatusIcon();
      // Check today's notifications
      triggerDailyCheck();
      return;
    }

    // Show permission banner if not denied
    const perm = Notification.permission;
    if (perm === 'default') {
      showNotifBanner();
    } else if (perm === 'granted') {
      await subscribeToPush();
      triggerDailyCheck();
    }
  } catch (err) {
    console.error('SW error:', err);
  }
}

function showNotifBanner() {
  const banner = document.getElementById('notifBanner');
  setTimeout(() => banner.classList.add('show'), 1500);
}

document.getElementById('notifAllow')?.addEventListener('click', async () => {
  vibrate(VIBRATE.gentle);
  document.getElementById('notifBanner').classList.remove('show');
  await requestAndSubscribe();
});

document.getElementById('notifDismiss')?.addEventListener('click', () => {
  document.getElementById('notifBanner').classList.remove('show');
  localStorage.setItem('notif_dismissed', Date.now());
});

document.getElementById('btnNotifyStatus')?.addEventListener('click', async () => {
  const perm = Notification.permission;
  if (perm === 'granted' && state.pushSubscription) {
    toast('🔔 Notificaciones activas ✓');
    vibrate(VIBRATE.gentle);
    // Trigger immediate check
    triggerDailyCheck();
  } else if (perm === 'denied') {
    toast('🔕 Notificaciones bloqueadas en ajustes del navegador');
  } else {
    await requestAndSubscribe();
  }
});

async function requestAndSubscribe() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    vibrate(VIBRATE.welcome);
    await subscribeToPush();
    triggerDailyCheck();
    toast('🔔 ¡Notificaciones activadas! 💖');
    updateNotifyStatusIcon();
  } else {
    toast('🔕 Notificaciones no habilitadas');
  }
}

async function subscribeToPush() {
  if (!state.swRegistration) return;
  try {
    const vapidData = await apiFetch('get_vapid_key');
    if (!vapidData?.publicKey) return;

    const sub = await state.swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(vapidData.publicKey),
    });

    state.pushSubscription = sub;
    const subJson = sub.toJSON();

    await apiFetch('subscribe', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: { p256dh: subJson.keys.p256dh, auth: subJson.keys.auth },
      }),
    });

    updateNotifyStatusIcon();
  } catch (err) {
    console.error('Push subscribe error:', err);
    toast('No se pudo activar las notificaciones');
  }
}

function updateNotifyStatusIcon() {
  const btn  = document.getElementById('btnNotifyStatus');
  const icon = document.getElementById('notifyStatusIcon');
  if (!btn || !icon) return;
  btn.style.display = '';
  const perm = Notification.permission;
  if (perm === 'granted' && state.pushSubscription) {
    icon.textContent = '🔔';
    btn.title = 'Notificaciones activas';
  } else {
    icon.textContent = '🔕';
    btn.title = 'Activar notificaciones';
  }
}

async function triggerDailyCheck() {
  try {
    const data = await apiFetch('check_notify', { method: 'POST' });
    if (data.notifications > 0) {
      console.log(`Enviadas ${data.notifications} notificaciones para hoy`);
    }
  } catch (_) {}
}

function urlB64ToUint8Array(base64String) {
  const padding  = '='.repeat((4 - base64String.length % 4) % 4);
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData  = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

// ── In-app vibrate on notification (from SW) ─────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'vibrate') {
      vibrate(event.data.pattern || VIBRATE.event);
    }
  });
}

// ── Modal helpers ────────────────────────────────────────────
function openModal(id)  {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.modal-overlay').forEach(ov => {
  ov.addEventListener('click', e => { if (e.target === ov) { vibrate(VIBRATE.gentle); closeModal(ov.id); } });
});

document.getElementById('closeEventModal').addEventListener('click', () => closeModal('eventModal'));
document.getElementById('cancelEventBtn').addEventListener('click',  () => closeModal('eventModal'));
document.getElementById('closeDayModal').addEventListener('click',   () => closeModal('dayModal'));
document.getElementById('closeNoteModal').addEventListener('click',  () => closeModal('noteModal'));
document.getElementById('cancelNoteBtn').addEventListener('click',   () => closeModal('noteModal'));

document.getElementById('btnAddEvent').addEventListener('click',  () => { vibrate(VIBRATE.gentle); openAddModal(); });
document.getElementById('btnAddEvent2')?.addEventListener('click', () => { vibrate(VIBRATE.gentle); openAddModal(); });
document.getElementById('btnAddNote').addEventListener('click',  () => { vibrate(VIBRATE.gentle); openModal('noteModal'); });

document.getElementById('btnAddInDay').addEventListener('click', () => {
  const d = state.selectedDate;
  vibrate(VIBRATE.gentle);
  closeModal('dayModal');
  openAddModal(d);
});

// Month nav
document.getElementById('prevMonth').addEventListener('click', async () => {
  vibrate(VIBRATE.gentle);
  if (--state.currentMonth < 1) { state.currentMonth = 12; state.currentYear--; }
  await refreshEvents();
});
document.getElementById('nextMonth').addEventListener('click', async () => {
  vibrate(VIBRATE.gentle);
  if (++state.currentMonth > 12) { state.currentMonth = 1; state.currentYear++; }
  await refreshEvents();
});

// Category / mood buttons
document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    vibrate(VIBRATE.gentle);
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
document.querySelectorAll('.mood-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    vibrate(VIBRATE.gentle);
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
  setTimeout(() => el.classList.remove('show'), 2600);
}

// ── Particles ────────────────────────────────────────────────
function spawnParticles() {
  const container = document.getElementById('particles');
  const hearts    = ['❤️','💖','💕','🌹','✨','💗','💓','🌸'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle heart';
    p.style.cssText = `left:${Math.random()*100}%;--dur:${6+Math.random()*8}s;--delay:${Math.random()*10}s;--size:${9+Math.random()*8}px;`;
    p.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    container.appendChild(p);
  }
}

// ── Utilities ────────────────────────────────────────────────
function pad(n)   { return String(n).padStart(2, '0'); }
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
  return new Date(str).toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' });
}

// ── Sticky header reveal on scroll ───────────────────────────
(function initStickyHeader() {
  const header = document.querySelector('.app-header');
  const hero   = document.querySelector('.hero-image-wrap');
  if (!header || !hero) return;

  // Start hidden — show only after scrolling past the hero
  header.style.opacity = '0';
  header.style.transform = 'translateY(-100%)';
  header.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

  const observer = new IntersectionObserver(
    ([entry]) => {
      const past = !entry.isIntersecting;
      header.style.opacity   = past ? '1' : '0';
      header.style.transform = past ? 'translateY(0)' : 'translateY(-100%)';
    },
    { threshold: 0.1 }
  );
  observer.observe(hero);
})();

// ── Init ─────────────────────────────────────────────────────
(async function init() {
  spawnParticles();
  await refreshEvents();
  await loadNotes();
  await initPushNotifications();
})();
