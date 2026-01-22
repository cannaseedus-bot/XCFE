/**
 * XCFE Benchmark Harness v1
 *
 * @artifact xcfe://cli/bench/v1
 */

import { performance } from "perf_hooks";
import { error, flag } from "./router.js";
import { runSandboxed } from "./sandbox.js";

const DEFAULT_ENDPOINT = "http://localhost:8080";

/**
 * xcfe bench --prompt "..." [--via phi3,llama] [--runs 50] [--endpoint url] [--cmd "binary arg"]
 */
export async function cmdBench(args) {
  const prompt = flag(args, "--prompt");
  if (!prompt) throw error("Missing --prompt for bench", 64);

  const via = flag(args, "--via");
  const runs = Number(flag(args, "--runs") ?? 10);
  const endpoint = flag(args, "--endpoint") ?? DEFAULT_ENDPOINT;
  const cmd = flag(args, "--cmd");

  if (Number.isNaN(runs) || runs <= 0) {
    throw error("--runs must be a positive integer", 64);
  }

  if (cmd) {
    await benchCommand(cmd, prompt, runs);
    return;
  }

  const models = via ? via.split(",").map((m) => m.trim()).filter(Boolean) : [null];
  for (const model of models) {
    const avgMs = await benchRemote(endpoint, prompt, runs, model);
    const label = model ?? "default";
    console.log(`Model: ${label} | avg: ${avgMs.toFixed(2)}ms`);
  }
}

async function benchRemote(endpoint, prompt, runs, model) {
  const url = model
    ? `${endpoint}/xcfe/infer?model=${encodeURIComponent(model)}`
    : `${endpoint}/xcfe/infer`;

  let total = 0;
  for (let i = 0; i < runs; i += 1) {
    const start = performance.now();
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ prompt })
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw error(`Bench request failed (${res.status}): ${body || res.statusText}`, res.status);
    }

    await res.text();
    total += performance.now() - start;
  }

  return total / runs;
}

async function benchCommand(cmd, prompt, runs) {
  const [binary, ...rest] = cmd.split(/\s+/).filter(Boolean);
  if (!binary) throw error("--cmd must include a binary", 64);

  let total = 0;
  for (let i = 0; i < runs; i += 1) {
    const start = performance.now();
    await runSandboxed({
      command: binary,
      args: rest,
      input: prompt,
      timeoutMs: 30000
    });
    total += performance.now() - start;
  }

  console.log(`Command: ${binary} | avg: ${(total / runs).toFixed(2)}ms`);
}
