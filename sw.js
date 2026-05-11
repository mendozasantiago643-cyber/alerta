// ALERTA — Service Worker v3.0
// UMAA IMSS Aguascalientes
// Con soporte de pantalla completa y notificaciones críticas

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyAgA_6uXxFvHsdcmgRW7faI2dkVm7weqZc",
  authDomain:        "alerta-umaa.firebaseapp.com",
  projectId:         "alerta-umaa",
  storageBucket:     "alerta-umaa.firebasestorage.app",
  messagingSenderId: "1026222287592",
  appId:             "1:1026222287592:web:80edd883f06e4689daf75d",
  databaseURL:       "https://alerta-umaa-default-rtdb.firebaseio.com"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const data   = payload.data || {};
  const esReal = data.modo === 'real';
  const title  = esReal
    ? '🚨 EMERGENCIA REAL — ' + (data.subtipo || 'ALERTA').toUpperCase()
    : '🛡️ SIMULACRO — '      + (data.subtipo || '').toUpperCase();

  const options = {
    body:               (data.zona||'') + ' · ' + (data.hora||'') + ' · ' + (data.reportadoPor||''),
    icon:               'icon-192.png',
    badge:              'icon-192.png',
    // Vibración intensa
    vibrate:            esReal
      ? [800,200,800,200,800,200,800,200,800,200,1000]
      : [400,100,400,100,400],
    // NO se cierra sola — el usuario debe responder
    requireInteraction: true,
    // Reemplaza notificaciones anteriores del mismo canal
    tag:                'alerta-' + (data.canal || 'general'),
    renotify:           true,
    // Abre en pantalla completa (Android 10+)
    data: {
      url:          './?alerta=1&modo='+(data.modo||'real')+'&tipo='+(data.subtipo||'')+'&zona='+(data.zona||'')+'&quien='+(data.reportadoPor||'')+'&hora='+(data.hora||'')+'&canal='+(data.canal||''),
      modo:         data.modo,
      subtipo:      data.subtipo,
      zona:         data.zona,
      reportadoPor: data.reportadoPor,
      hora:         data.hora,
      canal:        data.canal
    },
    actions: [
      { action: 'salvo',     title: '✅ Estoy a salvo'  },
      { action: 'evacuando', title: '🏃 Evacuando'      },
      { action: 'ayuda',     title: '⚠️ Necesito ayuda' }
    ],
    // Silencia DND en Android (si el canal de notificación lo permite)
    silent: false
  };

  return self.registration.showNotification(title, options);
});

// Al tocar la notificación o sus acciones
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const data = event.notification.data || {};
  const url  = data.url || './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // Si la app ya está abierta, enfócala
      for (const c of list) {
        if (c.url.includes('alerta') && 'focus' in c) {
          c.focus();
          c.postMessage({ tipo: 'notif_click', action: event.action, data });
          return;
        }
      }
      // Si no está abierta, ábrela
      return clients.openWindow(url);
    })
  );
});

// Instalación y activación inmediata
self.addEventListener('install',  e => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Cache offline
const CACHE = 'alerta-v3';
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(['./index.html','./manifest.json','./icon-192.png','./icon-512.png'])
       .catch(() => {})
    )
  );
});
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
