// Service worker mínimo: permite instalar la app y abre el "cascarón" sin conexión.
// Los datos siempre vienen en vivo de Supabase (no se cachean).
const CACHE = "furor-shell-v7";
const SHELL = ["./", "index.html", "styles.css", "app.js", "config.js", "manifest.webmanifest", "icons/icon-192.png", "img/logo-furor.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  // Red primero; si no hay conexión, usa lo guardado.
  e.respondWith(
    fetch(e.request, {cache:"no-cache"}).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request))
  );
});

// ---------- Notificaciones push ----------
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { titulo: "Furor", cuerpo: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.titulo || "Furor", {
    body: d.cuerpo || "",
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    tag: d.url || "furor",
    renotify: true,
    data: { url: d.url || "#inicio" }
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const destino = new URL("./" + (e.notification.data?.url || "#inicio"), self.registration.scope).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) {
      if (w.url.startsWith(self.registration.scope)) { await w.focus(); w.postMessage({ tipo: "ir", url: e.notification.data?.url || "#inicio" }); return; }
    }
    await self.clients.openWindow(destino);
  })());
});
