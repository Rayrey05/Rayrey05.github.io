/* Postura service worker — makes the app work offline after one online visit.
 *
 * - The page itself and its icons are saved when the worker installs.
 * - The page uses network-first (so updates arrive as soon as you're online),
 *   falling back to the saved copy when offline or when the network is slow.
 * - The face-tracking library, model files and fonts (from jsDelivr / Google
 *   Fonts) are cache-first: they're version-pinned, so a saved copy never goes
 *   stale. The page also asks this worker to save them explicitly after the
 *   detector loads (see warmOfflineCache in index.html).
 *
 * Bump VERSION when you want every visitor to drop their old saved files.
 */
const VERSION = 'postura-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];
const CDN_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const NETWORK_TIMEOUT_MS = 4000;

function isAllowed(url) {
  return url.origin === self.location.origin || CDN_HOSTS.indexOf(url.hostname) !== -1;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => Promise.all(SHELL.map((u) => cache.add(u).catch(() => { /* one miss shouldn't block install */ }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(VERSION);
  const network = fetch(request).then((response) => {
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  });
  network.catch(() => { /* handled below */ });
  try {
    return await Promise.race([
      network,
      new Promise((_, reject) => setTimeout(() => reject(new Error('slow network')), NETWORK_TIMEOUT_MS))
    ]);
  } catch (err) {
    let cached = await cache.match(request, { ignoreSearch: true });
    if (!cached && request.mode === 'navigate') {
      cached = (await cache.match('./index.html')) || (await cache.match('./'));
    }
    if (cached) return cached;
    return network; // nothing saved: wait for the network after all (or fail if offline)
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(request);
  const refresh = fetch(request).then((response) => {
    if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone());
    return response;
  });
  refresh.catch(() => { /* offline: the saved copy is used */ });
  return cached || refresh;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!isAllowed(url)) return;

  if (request.mode === 'navigate' || url.origin === self.location.origin) {
    event.respondWith(networkFirst(request));
  } else if (url.hostname === 'fonts.googleapis.com') {
    event.respondWith(staleWhileRevalidate(request)); // the font stylesheet
  } else {
    event.respondWith(cacheFirst(request));           // pinned library, models, font files
  }
});

// The page lists the CDN files it just loaded; save any that aren't saved yet.
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'CACHE_URLS' || !Array.isArray(data.urls)) return;
  const source = event.source;
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    let ok = 0, failed = 0;
    await Promise.all(data.urls.map(async (u) => {
      try {
        if (!isAllowed(new URL(u))) return;
        if (await cache.match(u)) { ok += 1; return; }
        const response = await fetch(u);
        if (response && response.ok) { await cache.put(u, response); ok += 1; }
        else failed += 1;
      } catch (e) { failed += 1; }
    }));
    if (source) source.postMessage({ type: 'CACHE_RESULT', ok, failed });
  })());
});
