// hive-cluster.js — real local REST hive (discovery + rendezvous routing + TTL)
// Node 18+ (global fetch). No deps.

import crypto from "crypto";

export function createHiveCluster(options = {}) {
  const cfg = {
    nodeId: options.nodeId || null,
    nodeUrl: mustStr(options.nodeUrl, "nodeUrl required"),
    // List of seed URLs (strings) the node can attempt to join
    seeds: Array.isArray(options.seeds) ? options.seeds.slice() : [],
    // Heartbeat + TTL
    heartbeatMs: options.heartbeatMs ?? 2500,
    ttlMs: options.ttlMs ?? 9000,
    // Limits / safety
    maxNodes: options.maxNodes ?? 4096,
    // When true, try to join seeds immediately
    autoJoin: options.autoJoin ?? true,
    // Optional: static "cluster id" to avoid cross-talk on same machine
    hiveId: options.hiveId || "local",
    // Route namespace
    basePath: options.basePath || "/hive",
    // Allow self-registration
    allowSelfJoin: options.allowSelfJoin ?? true
  };

  const self = {
    node_id: cfg.nodeId || deriveNodeId(cfg.nodeUrl, cfg.hiveId),
    url: cfg.nodeUrl,
    hive_id: cfg.hiveId,
    started_utc: isoUtc(),
    // monotonic-ish sequence to help debug/ops; not used for authority
    seq: 0
  };

  // node_id -> node record
  // record: { node_id, url, first_seen_ms, last_seen_ms, meta }
  const nodes = new Map();
  nodes.set(self.node_id, {
    node_id: self.node_id,
    url: self.url,
    first_seen_ms: Date.now(),
    last_seen_ms: Date.now(),
    meta: { self: true, hive_id: cfg.hiveId }
  });

  let timer = null;
  let joining = false;

  function start() {
    if (timer) return;
    timer = setInterval(tick, 250);
    if (cfg.autoJoin) joinSeeds().catch(() => {});
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function tick() {
    // TTL eviction
    const now = Date.now();
    for (const [id, n] of nodes) {
      if (id === self.node_id) continue;
      if (now - n.last_seen_ms > cfg.ttlMs) nodes.delete(id);
    }

    // Heartbeat (to all known nodes, best-effort)
    self.seq++;
    const hbDue = (self.seq % Math.max(1, Math.floor(cfg.heartbeatMs / 250))) === 0;
    if (hbDue) {
      broadcastHeartbeat().catch(() => {});
    }
  }

  function listNodes() {
    const now = Date.now();
    const out = [];
    for (const n of nodes.values()) {
      out.push({
        node_id: n.node_id,
        url: n.url,
        age_ms: now - n.first_seen_ms,
        last_seen_ms: n.last_seen_ms,
        meta: n.meta || {}
      });
    }
    // stable order
    out.sort((a, b) => (a.node_id < b.node_id ? -1 : a.node_id > b.node_id ? 1 : 0));
    return out;
  }

  function health() {
    const now = Date.now();
    const all = listNodes();
    const alive = all.filter(n => (now - n.last_seen_ms) <= cfg.ttlMs);
    return {
      "@type": "hive.health",
      "@version": "1.0.0",
      hive_id: cfg.hiveId,
      self: { node_id: self.node_id, url: self.url },
      counts: { total: all.length, alive: alive.length },
      ttl_ms: cfg.ttlMs,
      heartbeat_ms: cfg.heartbeatMs,
      now_utc: isoUtc()
    };
  }

  function upsertNode({ node_id, url, meta }) {
    mustStr(node_id, "node_id required");
    mustStr(url, "url required");
    if (nodes.size >= cfg.maxNodes && !nodes.has(node_id)) return false;

    const now = Date.now();
    const existing = nodes.get(node_id);
    if (existing) {
      existing.url = url;
      existing.last_seen_ms = now;
      if (meta && typeof meta === "object") existing.meta = { ...(existing.meta || {}), ...meta };
    } else {
      nodes.set(node_id, {
        node_id,
        url,
        first_seen_ms: now,
        last_seen_ms: now,
        meta: meta && typeof meta === "object" ? meta : {}
      });
    }
    return true;
  }

  async function joinSeeds() {
    if (joining) return;
    joining = true;
    try {
      // try seeds in order; add nodes discovered by them
      for (const seed of cfg.seeds) {
        await tryJoin(seed).catch(() => {});
      }
    } finally {
      joining = false;
    }
  }

  async function tryJoin(seedUrl) {
    if (!seedUrl || seedUrl === self.url) return;
    const joinUrl = normalizeUrl(seedUrl, cfg.basePath + "/join");
    const body = {
      "@type": "hive.join.request",
      "@version": "1.0.0",
      hive_id: cfg.hiveId,
      node: { node_id: self.node_id, url: self.url },
      // helps seed decide if it wants to accept, but no authority claim
      meta: { client: "xjson-server", ts_utc: isoUtc() }
    };

    const res = await fetchJson(joinUrl, body);
    if (res?.nodes && Array.isArray(res.nodes)) {
      for (const n of res.nodes) {
        if (n?.node_id && n?.url) upsertNode({ node_id: n.node_id, url: n.url, meta: n.meta || {} });
      }
    }
  }

  async function broadcastHeartbeat() {
    const peers = [];
    for (const n of nodes.values()) {
      if (n.node_id === self.node_id) continue;
      peers.push(n.url);
    }
    if (!peers.length) return;

    // send in parallel, but keep bounded
    const body = {
      "@type": "hive.heartbeat",
      "@version": "1.0.0",
      hive_id: cfg.hiveId,
      node: { node_id: self.node_id, url: self.url },
      seen: { count: nodes.size }
    };

    await boundedMap(peers, 8, async (peerUrl) => {
      const hbUrl = normalizeUrl(peerUrl, cfg.basePath + "/heartbeat");
      try {
        const res = await fetchJson(hbUrl, body, 800);
        // merge nodes if provided
        if (res?.nodes && Array.isArray(res.nodes)) {
          for (const n of res.nodes) {
            if (n?.node_id && n?.url) upsertNode({ node_id: n.node_id, url: n.url, meta: n.meta || {} });
          }
        }
      } catch {
        // no-op; TTL eviction will handle
      }
    });
  }

  // Rendezvous (highest-random-weight) hashing
  // Returns the best node for a given key based on current alive nodes
  function routeKey(key) {
    mustStr(key, "key required");
    const alive = listNodes(); // stable list
    if (!alive.length) {
      return { node_id: self.node_id, url: self.url, reason: "no_nodes" };
    }

    let best = null;
    let bestScore = null;

    for (const n of alive) {
      // weight = sha256(hive_id | key | node_id)
      const scoreHex = sha256hex(`${cfg.hiveId}|${key}|${n.node_id}`);
      // Use first 16 hex chars as unsigned bigint-ish compare
      // (string compare is okay because fixed-length hex)
      const score = scoreHex.slice(0, 16);
      if (bestScore === null || score > bestScore) {
        bestScore = score;
        best = n;
      }
    }
    return { node_id: best.node_id, url: best.url, score: bestScore };
  }

  // ---------------------------
  // HTTP handlers (plug into your server router)
  // ---------------------------

  function handle(req, res, pathname, jsonBody /* already parsed or null */) {
    const base = cfg.basePath;

    if (pathname === base + "/health" && req.method === "GET") {
      return replyJson(res, 200, health());
    }

    if (pathname === base + "/nodes" && req.method === "GET") {
      return replyJson(res, 200, {
        "@type": "hive.nodes",
        "@version": "1.0.0",
        hive_id: cfg.hiveId,
        self: { node_id: self.node_id, url: self.url },
        nodes: listNodes()
      });
    }

    if (pathname === base + "/join" && req.method === "POST") {
      const body = jsonBody || {};
      if (body.hive_id !== cfg.hiveId) {
        return replyJson(res, 409, { error: "hive_id_mismatch" });
      }
      const node = body.node || {};
      const node_id = node.node_id;
      const url = node.url;

      if (!cfg.allowSelfJoin && url === self.url) {
        return replyJson(res, 403, { error: "self_join_forbidden" });
      }

      if (node_id && url) upsertNode({ node_id, url, meta: body.meta || {} });

      // respond with current view to accelerate convergence
      return replyJson(res, 200, {
        "@type": "hive.join.response",
        "@version": "1.0.0",
        hive_id: cfg.hiveId,
        self: { node_id: self.node_id, url: self.url },
        nodes: listNodes()
      });
    }

    if (pathname === base + "/leave" && req.method === "POST") {
      const body = jsonBody || {};
      const node = body.node || {};
      if (body.hive_id !== cfg.hiveId) return replyJson(res, 409, { error: "hive_id_mismatch" });
      if (node.node_id && node.node_id !== self.node_id) nodes.delete(node.node_id);
      return replyJson(res, 200, { ok: true });
    }

    if (pathname === base + "/heartbeat" && req.method === "POST") {
      const body = jsonBody || {};
      if (body.hive_id !== cfg.hiveId) return replyJson(res, 409, { error: "hive_id_mismatch" });

      const node = body.node || {};
      if (node.node_id && node.url) upsertNode({ node_id: node.node_id, url: node.url, meta: { heartbeat: true } });

      // return nodes sometimes to help gossip converge
      return replyJson(res, 200, {
        "@type": "hive.heartbeat.response",
        "@version": "1.0.0",
        hive_id: cfg.hiveId,
        nodes: listNodes()
      });
    }

    if (pathname === base + "/route" && req.method === "POST") {
      const body = jsonBody || {};
      if (body.hive_id && body.hive_id !== cfg.hiveId) return replyJson(res, 409, { error: "hive_id_mismatch" });
      const key = body.key;
      if (typeof key !== "string" || !key.length) return replyJson(res, 400, { error: "missing_key" });
      const routed = routeKey(key);
      return replyJson(res, 200, {
        "@type": "hive.route.response",
        "@version": "1.0.0",
        hive_id: cfg.hiveId,
        key,
        routed
      });
    }

    return false; // not handled
  }

  return {
    cfg,
    self,
    start,
    stop,
    joinSeeds,
    listNodes,
    health,
    routeKey,
    upsertNode,
    handle
  };
}

/* ---------------- utils ---------------- */

function mustStr(v, msg) {
  if (typeof v !== "string" || v.length === 0) throw new Error(msg);
  return v;
}

function isoUtc() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function sha256hex(s) {
  return crypto.createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex");
}

function deriveNodeId(url, hiveId) {
  // Deterministic ID from (hiveId | url)
  const h = sha256hex(`${hiveId}|${url}`);
  return "node_" + h.slice(0, 24);
}

function normalizeUrl(baseUrl, path) {
  // baseUrl like http://127.0.0.1:3000
  if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
  return baseUrl + path;
}

async function fetchJson(url, body, timeoutMs = 1500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body, null, 0),
      signal: ctrl.signal
    });
    if (!r.ok) throw new Error(`http_${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function boundedMap(items, limit, fn) {
  const q = items.slice();
  const workers = [];
  for (let i = 0; i < limit; i++) {
    workers.push((async () => {
      while (q.length) {
        const it = q.shift();
        if (it === undefined) return;
        await fn(it);
      }
    })());
  }
  await Promise.all(workers);
}

function replyJson(res, code, obj) {
  const out = JSON.stringify(obj, null, 0);
  res.statusCode = code;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(out + "\n");
}
