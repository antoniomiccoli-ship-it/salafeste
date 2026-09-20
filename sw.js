/**
 * Service worker minimo: serve a rendere l'app installabile e ad aprire
 * subito il guscio anche con rete lenta. Non mette in cache i dati delle
 * prenotazioni, che devono sempre arrivare aggiornati dal foglio.
 */
const CACHE = 'salafeste-guscio-v1';
const GUSCIO = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icona-192.png',
  './icona-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(GUSCIO)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((chiavi) => Promise.all(chiavi.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Tutto ciò che non è il guscio (cioè l'app vera) passa dalla rete.
  if (url.origin !== self.location.origin || e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((risposta) => {
        const copia = risposta.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia)).catch(() => {});
        return risposta;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
