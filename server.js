// server.js — minimal wiring for JSON REST server + hive cluster
import http from "http";

import { createHiveCluster } from "./hive-cluster.js";
import { createJsonApiRouter } from "./json-api-router.js";

const PORT = Number(process.env.PORT ?? 3000);
const BASE = `http://127.0.0.1:${PORT}`;

const hive = createHiveCluster({
  nodeUrl: BASE,
  seeds: (process.env.HIVE_SEEDS ? process.env.HIVE_SEEDS.split(",") : []).filter(Boolean),
  hiveId: process.env.HIVE_ID || "local",
  heartbeatMs: Number(process.env.HIVE_HEARTBEAT_MS ?? 2500),
  ttlMs: Number(process.env.HIVE_TTL_MS ?? 9000),
  basePath: "/hive",
  autoJoin: true
});

const api = createJsonApiRouter({
  basePath: "",
  dbPath: "/db",
  dbFile: process.env.DB_FILE || null,
  serverName: "xjson-json-rest-server",
  version: "1.1.0"
});

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Read body if needed
    let raw = null;
    let json = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      raw = await readBody(req, 2_000_000);
      if (raw && raw.length) {
        const s = raw.toString("utf8");
        try { json = JSON.parse(s); } catch { json = null; }
      }
    }

    // hive routes first
    if (hive.handle(req, res, pathname, json) !== false) return;

    // json api routes
    if (api.handle(req, res, pathname, json, raw) !== false) return;

    // default
    res.statusCode = 404;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "not_found" }) + "\n");
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "server_error", message: String(e.message ?? e) }) + "\n");
  }
});

server.listen(PORT, () => {
  hive.start();
  console.log(`JSON REST server: ${BASE}`);
  console.log(`Hive health:     ${BASE}/hive/health`);
  console.log(`DB root:         ${BASE}/db`);
});

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0;
    req.on("data", (c) => {
      n += c.length;
      if (n > maxBytes) {
        reject(new Error("body_too_large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
