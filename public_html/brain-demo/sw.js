const CACHE = "brain-ide-v3";
const CHANNEL_CACHE = "xjson-release-channel";
const CHANNEL_KEY = "/brain-demo/channel";
const DEFAULT_CHANNEL = "stable";
const ASSETS = [
  "/brain-demo/",
  "/brain-demo/index.html",
  "/brain-demo/manifest.webmanifest",
  "/brain-demo/css/style.css",
  "/brain-demo/js/app.js",
  "/brain-demo/js/brain-runtime.js",
  "/brain-demo/js/brain-visualizer.js",
  "/brain-demo/js/brain-proof.js",
  "/brain-demo/js/brain-federation.js",
  "/brain-demo/js/lane-heatmap.js",
  "/brain-demo/js/training-timelapse.js",
  "/brain-demo/js/p2p.js",
  "/brain-demo/js/p2p-proto.js",
  "/brain-demo/wasm/scxq2_decoder.js",
  "/brain-demo/release.json"
];

let releaseCacheName = CACHE;

async function getChannel() {
  try {
    const cache = await caches.open(CHANNEL_CACHE);
    const match = await cache.match(CHANNEL_KEY);
    if (!match) return DEFAULT_CHANNEL;
    const text = await match.text();
    return text || DEFAULT_CHANNEL;
  } catch (err) {
    console.warn("[sw] failed to read channel", err);
    return DEFAULT_CHANNEL;
  }
}

async function setChannel(channel) {
  const cache = await caches.open(CHANNEL_CACHE);
  await cache.put(CHANNEL_KEY, new Response(channel));
}

async function fetchRelease(channel) {
  const releasePath =
    channel === "stable" ? "/brain-demo/release.json" : `/brain-demo/${channel}/release.json`;
  const res = await fetch(releasePath, { cache: "no-store" });
  if (!res.ok) throw new Error(`release fetch failed ${res.status}`);
  return res.json();
}

async function updateReleaseCache(channel) {
  try {
    const release = await fetchRelease(channel);
    releaseCacheName = `brain-ide-${release.channel}-${release.version}`;
    const cache = await caches.open(releaseCacheName);
    await cache.addAll(release.assets);
  } catch (err) {
    console.warn("[sw] release update failed", err);
  }
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE && k !== CHANNEL_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
  e.waitUntil(
    (async () => {
      const channel = await getChannel();
      await updateReleaseCache(channel);
    })()
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request))
  );
});

self.addEventListener("message", async (e) => {
  const msg = e.data;
  if (!msg) return;

  if (msg.type === "set-channel") {
    await setChannel(msg.channel);
    await updateReleaseCache(msg.channel);
    return;
  }

  if (msg.type === "check-update") {
    const channel = await getChannel();
    await updateReleaseCache(channel);
    return;
  }

  if (msg.type === "publish-delta") {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    for (const client of clients) {
      client.postMessage({ type: "mesh-delta", payload: msg.payload });
    }
    return;
  }

  if (msg.t !== "cache_brain_bin") return;

  const { cacheKey, bytes } = msg;
  const cache = await caches.open(CACHE);

  await cache.put(
    cacheKey,
    new Response(bytes, { headers: { "Content-Type": "application/octet-stream" } })
  );

  e.source?.postMessage?.({ t: "cache_ok", cacheKey });
});
