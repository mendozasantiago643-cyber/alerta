// ALERTA — Service Worker v2.0
// UMAA IMSS Aguascalientes

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
  const data = payload.data || {};
  const esReal = data.modo === 'real';
  const title  = esReal
    ? '🚨 EMERGENCIA REAL — ' + (data.subtipo || 'ALERTA').toUpperCase()
    : '🛡️ SIMULACRO — '      + (data.subtipo || '').toUpperCase();
  const options = {
    body:             (data.zona || '') + ' · ' + (data.hora || '') + ' · ' + (data.reportadoPor || ''),
    icon:             'icon-192.png',
    badge:            'icon-192.png',
    vibrate:          esReal ? [500,100,500,100,500,100,800] : [300,100,300],
    requireInteraction: esReal,
    tag:              'alerta-' + (data.canal || 'general'),
    renotify:         true,
    data:             { url: './', ...data },
    actions: [
      { action: 'salvo',     title: '✅ A salvo'    },
      { action: 'evacuando', title: '🏃 Evacuando'  }
    ]
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('alerta') && 'focus' in c) return c.focus();
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('install',  e => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Cache básico para offline
const CACHE = 'alerta-v2';
const OFFLINE_FILES = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(OFFLINE_FILES).catch(()=>{}))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
