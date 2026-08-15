const CACHE = 'sensoria-family-v4';
const STATIC_PATH = /\.(?:css|js|png|svg|webp|ico|woff2?)$/i;

// En el despliegue de un solo dominio la plataforma profesional comparte origen bajo /pro/.
// Este service worker pertenece a la PWA familiar y su alcance no debe invadirla: sin esta
// exclusión, una navegación a /pro/ sin conexión respondería con la aplicación equivocada.
function isOwnedByFamilyApp(url) {
  return url.origin === self.location.origin
    && !url.pathname.startsWith('/api/')
    && !url.pathname.startsWith('/pro/');
}

function isStaticAsset(url) {
  return isOwnedByFamilyApp(url)
    && (STATIC_PATH.test(url.pathname) || url.pathname === '/manifest.webmanifest');
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add('/')));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith('sensoria-family-') && key !== CACHE).map((key) => caches.delete(key)),
  )));
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'PRECACHE_CURRENT_BUILD' || !Array.isArray(event.data.assets)) return;
  const staticAssets = event.data.assets.filter((value) => {
    try { return isStaticAsset(new URL(value)); } catch { return false; }
  });
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(staticAssets)));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.headers.has('Authorization')) return;
  const url = new URL(event.request.url);
  if (!isOwnedByFamilyApp(url)) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match('/')),
    );
    return;
  }

  if (!isStaticAsset(url)) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone();
      void caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  })));
});
