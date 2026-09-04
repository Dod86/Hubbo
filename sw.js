// Bump this string whenever you upload a new version of the app.
const CACHE = "hubbo-v73";

const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // `cache: "reload"` bypasses the browser's HTTP cache, otherwise a stale
      // copy of index.html can be baked into the new cache and the update never
      // actually reaches the device.
      Promise.all(
        CORE.map((url) =>
          fetch(new Request(url, { cache: "reload" }))
            .then((res) => (res && res.ok ? cache.put(url, res) : null))
            .catch(() => null)
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});

// Notification buttons are handled here and not in the page, because the
// notification outlives the page: it stays in the tray after the app is
// closed, and tapping it wakes only this worker. The worker has no access to
// the app's stored data, so anything a button needs to know travels with the
// notification itself.
self.addEventListener("notificationclick", (event) => {
  const action = event.action;
  const data = event.notification.data || {};
  event.notification.close();

  event.waitUntil(
    (async () => {
      // The cancellation address is built in the app, where the service name
      // and the chosen language are known, and carried on the notification.
      if (action === "cancel" && data.cancelUrl) {
        if (self.clients.openWindow) await self.clients.openWindow(data.cancelUrl);
        return;
      }

      const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of open) {
        if ("focus" in client) {
          client.postMessage({ type: "hubbo-open-sub", id: data.id || null });
          return client.focus();
        }
      }

      // Nothing open: a fresh page has nobody listening for messages yet, so
      // the subscription travels in the address instead.
      if (self.clients.openWindow) {
        await self.clients.openWindow(data.id ? "./#sub=" + encodeURIComponent(data.id) : "./");
      }
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // The page itself is fetched network-first: online you always get the newest
  // build, offline you still get the cached one.
  const isDocument = req.mode === "navigate" || (sameOrigin && url.pathname.endsWith(".html"));

  if (isDocument) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  // Everything else (icons, libraries, fonts) is fine cache-first.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && (res.status === 200 || res.type === "opaque")) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
