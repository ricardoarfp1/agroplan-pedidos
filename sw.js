// ══════════════════════════════════════════════════════
// AGROPLAN PWA — Service Worker
// Versão: 1.0.0
// Cache-first strategy para funcionar 100% offline
// ══════════════════════════════════════════════════════

const CACHE_NAME = 'agroplan-pedidos-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// ─── Instalação: cacheia os arquivos do app ───
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Ativação: limpa caches antigos ───
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch: cache-first, fallback para rede ───
self.addEventListener('fetch', event => {
  // Não intercepta requisições POST (sync para Google Sheets)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cacheia novas respostas válidas
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Se offline e não tem cache, retorna página principal
        return caches.match('./index.html');
      });
    })
  );
});

// ─── Listener de mensagem para sync manual ───
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
