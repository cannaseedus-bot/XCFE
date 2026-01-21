const CACHE = "brain-v1";
const ASSETS = [
  "/brain-demo/",
  "/brain-demo/index.html",
  "/brain-demo/css/style.css",
  "/brain-demo/js/app.js",
  "/brain-demo/js/brain-runtime.js",
  "/brain-demo/js/brain-visualizer.js",
  "/brain-demo/js/brain-proof.js",
  "/brain-demo/js/brain-federation.js",
  "/brain-demo/js/lane-heatmap.js",
  "/brain-demo/js/p2p.js",
  "/brain-demo/js/p2p-proto.js",
  "/brain-demo/wasm/scxq2_decoder.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      )
    )
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request))
  );
});

self.addEventListener("message", async (e) => {
  const msg = e.data;
  if (!msg || msg.t !== "cache_brain_bin") return;

  const { cacheKey, bytes } = msg;
  const cache = await caches.open(CACHE);

  await cache.put(
    cacheKey,
    new Response(bytes, { headers: { "Content-Type": "application/octet-stream" } })
  );

  e.source?.postMessage?.({ t: "cache_ok", cacheKey });
});
