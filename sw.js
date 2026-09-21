// Bump this string whenever you upload a new version of the app.
const CACHE = "hubbo-v283";

const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  // Parte 8A: copia locale immutabile della release. Il catalogo remoto è
  // fuori dal CORE e resta network-first; questo file esiste solo per
  // garantire un avvio offline anche senza una copia catalogo già salvata.
  "./offerte.json",
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
  // The page has no other way to find out which worker is actually in charge.
  // When the two versions disagree, the app on screen is new and the worker
  // handling its notifications is not.
  if (event.data === "version" && event.source) {
    event.source.postMessage({ type: "hubbo-sw-version", version: CACHE });
  }
});

// The worker only reports which button was pressed. It used to decide as well,
// but deciding needed the cancellation address to have survived the trip on the
// notification, and when it had not, the test fell through to the generic
// branch and both buttons opened the app. The app knows the subscriptions, so
// the app decides; all the worker has to get right is the name of the action.
self.addEventListener("notificationclick", (event) => {
  // Any button at all means the only button there is. Only an empty action —
  // the body of the notification — means "just open the app".
  const action = event.action ? "cancel" : "body";
  const reported = event.action || "";
  const data = event.notification.data || {};
  // Le notifiche di offerta (scheda "Da tenere d'occhio") non hanno pulsanti:
  // un tocco è sempre un tocco sul corpo. Portano l'utente all'offerta
  // dentro l'app, non fuori — la stessa regola di "nessuna iscrizione
  // automatica" vale anche per il tocco sulla notifica, non solo per il
  // pulsante dentro l'app.
  const isOffer = data.kind === "offer";
  event.notification.close();

  event.waitUntil(
    (async () => {
      const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const buttons = (event.notification.actions || []).map((a) => a.action).join(",");

      // Opening an outside address is allowed here and nowhere else: inside a
      // notification click the worker still carries the user's tap. The page
      // does not, which is why it must never be asked to do this quietly.
      let opened = false;
      let failure = "";
      if (!isOffer && action === "cancel" && data.cancelUrl && self.clients.openWindow) {
        try {
          await self.clients.openWindow(data.cancelUrl);
          opened = true;
        } catch (err) {
          // Some installed apps are refused an outside address; the page will
          // offer it as something to tap instead.
          failure = (err && err.message) || "rifiutata";
        }
      }

      // Written where the app can find it afterwards. The worker cannot reach
      // the app's storage, but its own cache is readable from both sides, and a
      // tap that opens an outside page never reaches the app at all.
      try {
        const log = await caches.open(CACHE);
        await log.put(
          new Request("./__hubbo_log"),
          new Response(
            JSON.stringify({
              at: Date.now(),
              action,
              // Kept alongside, so the name the phone actually gives is on the
              // record even though nothing depends on it any more.
              reported,
              buttons,
              kind: isOffer ? "offer" : "sub",
              id: isOffer ? "" : data.id || "",
              offerId: isOffer ? data.offerId || "" : "",
              servizio: isOffer ? data.servizio || "" : "",
              hasUrl: !!data.cancelUrl,
              opened,
              failure,
            })
          )
        );
      } catch {
        // A record that cannot be kept is not worth failing the tap over.
      }

      for (const client of open) {
        if ("focus" in client) {
          client.postMessage(
            isOffer
              ? { type: "hubbo-notification", kind: "offer", offerId: data.offerId || "", servizio: data.servizio || "" }
              : { type: "hubbo-notification", kind: "sub", action, id: data.id || null, cancelUrl: data.cancelUrl || null, buttons, opened }
          );
          if (opened) return;
          return client.focus();
        }
      }
      if (opened) return;
      // Nothing open: a fresh page has nobody listening yet, so both the button
      // and the subscription (or the offer) travel in the address.
      try {
        if (self.clients.openWindow) {
          const url = isOffer
            ? "./#notifOffer=" + encodeURIComponent(data.offerId || "") + "&servizio=" + encodeURIComponent(data.servizio || "")
            : "./#notif=" + encodeURIComponent(action) + "&sub=" + encodeURIComponent(data.id || "");
          await self.clients.openWindow(url);
        }
      } catch {
        // Nothing left to try, and a worker that throws here takes the other
        // notifications down with it.
      }
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // React, ReactDOM e il loro ripiego sul CDN vengono prima di tutto il
  // resto: anche il paracadute degli errori è costruito con React, quindi
  // se questi non arrivano non arriva nemmeno un messaggio d'errore, solo
  // uno schermo nero muto — è già successo una volta, il 16 settembre,
  // quando la cartella vendor/ non era stata caricata su GitHub insieme
  // al resto. Il caricatore a catena in index.html (vedi build/precompile.js)
  // ha già il proprio ripiego per questo esatto caso — ma passando anche
  // questi attraverso lo strato di cache qui sotto, qualcosa si rompeva:
  // lo script arrivava ma non veniva eseguito, senza errori visibili.
  // Lasciarli fuori dal tutto qui vuol dire che raggiungono la rete
  // esattamente come farebbero senza nessun service worker in mezzo.
  const isBootstrapScript =
    (sameOrigin && url.pathname.includes("/vendor/react")) ||
    (url.hostname === "unpkg.com" && /\/react(-dom)?@/.test(url.pathname));
  if (isBootstrapScript) return;

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

  // Catalogo e relativo manifest sono dati, non asset. `catalog/manifest.json`
  // deve restare network-first: se fosse cache-first il versioning remoto si
  // bloccherebbe sulla prima copia vista dal dispositivo. Anche entrambe le
  // copie di `offerte.json` restano network-first; il precache del fallback
  // locale garantisce soltanto l'uso offline.
  const isCatalogData = sameOrigin && (
    url.pathname.endsWith("offerte.json") ||
    url.pathname.endsWith("/catalog/manifest.json")
  );
  if (isCatalogData) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || Response.error()))
    );
    return;
  }

  // Only files are worth keeping. Caching everything meant the exchange rates
  // were answered forever from the first copy ever fetched — and if that first
  // fetch happened to fail, from nothing at all, which is why they could stop
  // arriving altogether and never recover.
  const isAsset =
    sameOrigin || ["script", "style", "font", "image"].indexOf(req.destination) !== -1;
  if (!isAsset) return;

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
        // Nothing cached and no network: an honest failure, not an empty
        // answer, which the page cannot tell apart from a real response.
        .catch(() => Response.error());
    })
  );
});
