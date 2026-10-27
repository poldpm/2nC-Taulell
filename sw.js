// Service worker: permet instal·lar l'app i obrir-la encara que falli la connexió.
// Estratègia "primer la xarxa": sempre es carrega la versió més nova; la còpia guardada
// només es fa servir si no hi ha internet. Les peticions a Firebase/Google no es toquen.
const CACHE = 'taulell-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // "no-cache": sempre es pregunta al servidor si hi ha una versió nova (si no, respon ràpid amb un 304).
  const xarxa = req.mode === 'navigate' ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req, { cache: 'no-cache' });
  e.respondWith(
    xarxa
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })),
  );
});
