// Guarda la app en el teléfono para que abra sin internet.
// La página se pide a la red primero (así llegan las versiones nuevas) y, sin red, sale de la caché.
const CACHE = 'habitos-v2.15.0';
const CORE = ['./', './index.html', './vendor/anthropic-sdk-0.134.0.mjs', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
});

// La app avisa «versión nueva lista» y, al tocar Actualizar, pide activarla.
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
  );
});

// Notificaciones enviadas por la tarea programada (Web Push): llegan aunque la app esté cerrada.
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data?.text() || '' }; }
  // Cada aviso trae un botón para apagar su tipo con un toque (la app lo aplica al abrirse).
  const op = { body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.tag, data: { url: d.url || './', tag: d.tag || '' } };
  if (d.apagar) op.actions = [{ action: 'apagar', title: String(d.apagar).slice(0, 40) }];
  // Cada tipo se repite cada día con su tag (h-leer, resumen…): el de hoy reemplaza al de ayer en la bandeja, pero vuelve a
  // sonar y vibrar (sin renotify, Android lo cambia en silencio). renotify exige tag.
  if (d.tag) op.renotify = true;
  e.waitUntil(Promise.all([self.registration.showNotification(d.title || 'Organización Personal', op), anotarRecibido(d.tag)]));
});
// Cada aviso que llega se anota en este teléfono (IndexedDB, los últimos 30 días): la app solo dice que un aviso «lleva
// 3 días sin servir» si de verdad sonó esos días. Si algo falla, el aviso se muestra igual.
function anotarRecibido(tag) {
  if (!tag || typeof indexedDB === 'undefined') return Promise.resolve();
  return new Promise(fin => {
    try {
      const r = indexedDB.open('avisos-recibidos', 1);
      r.onupgradeneeded = () => { const db = r.result; db.createObjectStore('recibidos', { autoIncrement: true }); db.createObjectStore('meta', { keyPath: 'k' }).put({ k: 'desde', desde: Date.now() }); };
      r.onerror = () => fin();
      r.onsuccess = () => {
        const db = r.result, t = Date.now();
        try {
          const tx = db.transaction('recibidos', 'readwrite'), os = tx.objectStore('recibidos');
          os.add({ tag: String(tag).slice(0, 80), t });
          const c = os.openCursor();
          c.onsuccess = () => { const x = c.result; if (x && !(x.value?.t > t - 30 * 864e5)) { x.delete(); x.continue(); } };
          tx.oncomplete = tx.onerror = tx.onabort = () => { db.close(); fin(); };
        } catch { db.close(); fin(); }
      };
    } catch { fin(); }
  });
}
// Al tocarla se abre la app (o se trae al frente) en la pestaña que corresponde.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const data = e.notification.data || {}, u = new URL(data.url || './', self.registration.scope);
  // La app anota qué aviso abriste (n=…) para saber cuáles sirven; con «Apagar», apaga ese tipo (off=1).
  if (data.tag) u.searchParams.set('n', data.tag);
  if (e.action === 'apagar') u.searchParams.set('off', '1');
  const url = u.href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    const w = ws.find(c => c.url.startsWith(self.registration.scope));
    if (w) { w.postMessage({ abrir: url }); return w.focus(); }
    return self.clients.openWindow(url);
  }));
});
