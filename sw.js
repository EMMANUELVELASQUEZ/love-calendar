/* ── Love Calendar Service Worker ────────────────────────── */
'use strict';

const CACHE_NAME = 'love-calendar-v2';
const ICON_SVG   = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
  '<rect width="100" height="100" rx="22" fill="#1a0a12"/>' +
  '<text y="72" x="50" text-anchor="middle" font-size="68">💖</text>' +
  '</svg>'
);

// ── Install ───────────────────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// ── Push received ─────────────────────────────────────────
self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Mi Calendario de Amor 💖', body: event.data?.text() || '' };
  }

  const title   = data.title   || 'Mi Calendario de Amor 💖';
  const body    = data.body    || '';
  const vibrate = data.vibrate || [200, 100, 200];
  const tag     = data.tag     || 'love-calendar-' + Date.now();
  const type    = data.type    || 'event';

  const options = {
    body,
    icon:             ICON_SVG,
    badge:            ICON_SVG,
    vibrate,
    tag,
    data:             { url: self.registration.scope, type },
    requireInteraction: type === 'holiday' || type === 'anniversary',
    silent:           false,
    actions: [
      { action: 'open',  title: '📅 Ver calendario' },
      { action: 'close', title: 'Cerrar' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click ────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        const existing = clientList.find(c => c.url.includes(self.registration.scope) && 'focus' in c);
        if (existing) return existing.focus();
        return clients.openWindow(self.registration.scope);
      })
  );
});

// ── Notification close ────────────────────────────────────
self.addEventListener('notificationclose', () => {});

// ── Background sync (when supported) ─────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'check-events') {
    event.waitUntil(checkTodayEvents());
  }
});

async function checkTodayEvents() {
  try {
    await fetch('/api.php?action=check_notify', { method: 'POST' });
  } catch (_) {}
}
