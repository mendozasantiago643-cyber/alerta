// ALERTA — Service Worker v1.0
// Maneja notificaciones push aunque la app esté cerrada

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAgA_6uXxFvHsdcmgRW7faI2dkVm7weqZc",
  authDomain: "alerta-umaa.firebaseapp.com",
  projectId: "alerta-umaa",
  storageBucket: "alerta-umaa.firebasestorage.app",
  messagingSenderId: "1026222287592",
  appId: "1:1026222287592:web:80edd883f06e4689daf75d",
  databaseURL: "https://alerta-umaa-default-rtdb.firebaseio.com"
});

const messaging = firebase.messaging();

// Manejar mensajes en segundo plano
messaging.onBackgroundMessage(payload => {
  console.log('[SW] Mensaje recibido en segundo plano:', payload);
  const data = payload.data || {};
  const esReal = data.modo === 'real';

  const options = {
    body: data.zona ? `${data.zona} · ${data.hora} · Reportado por ${data.reportadoPor}` : payload.notification?.body || 'Alerta activa',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="40" fill="%23cc2222"/><text x="96" y="130" font-size="100" text-anchor="middle">🔔</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="20" fill="%23cc2222"/><text x="48" y="65" font-size="50" text-anchor="middle">🔔</text></svg>',
    vibrate: esReal ? [500,100,500,100,500,100,800,100,800] : [300,100,300],
    requireInteraction: esReal, // No se cierra sola si es emergencia real
    tag: 'alerta-' + (data.canal || 'general'),
    renotify: true,
    data: { url: '/alerta/', ...data },
    actions: [
      { action: 'salvo',    title: '✅ A salvo' },
      { action: 'evacuando', title: '🏃 Evacuando' }
    ]
  };

  const title = esReal
    ? `🚨 EMERGENCIA REAL — ${(data.subtipo||'ALERTA').toUpperCase()}`
    : `🛡️ SIMULACRO — ${(data.subtipo||'').toUpperCase()}`;

  return self.registration.showNotification(title, options);
});

// Al tocar la notificación — abrir la app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/alerta/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('/alerta/') && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});

// Activación inmediata
self.addEventListener('install', e => { e.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
