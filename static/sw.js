// Service Worker sederhana untuk PWA Installability
const CACHE_NAME = 'keuanganku-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through agar tetap bisa loading normal tanpa offline support penuh
  // Untuk offline support beneran, bisa ditambahkan cache match di sini
  event.respondWith(fetch(event.request).catch(() => new Response('Offline')));
});
