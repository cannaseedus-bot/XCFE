import { decodeSCXQ2, loadSCXQ2, FALLBACK_BYTES } from "../wasm/scxq2_decoder.js";

let wasmExports = null;
let localBrain = null;

const heat = {
  GRAM: 0.1,
  EDGE: 0.1,
  PATH: 0.1,
  PROOF: 0.1
};

export async function loadBrain() {
  wasmExports = await loadSCXQ2();
  const bytes = await loadBrainBytes();
  localBrain = decodeSCXQ2(bytes, wasmExports);
  return { brain: localBrain, bytes };
}

async function loadBrainBytes() {
  try {
    const res = await fetch("brain.scxq2.bin");
    if (!res.ok) throw new Error(`missing brain.scxq2.bin (${res.status})`);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    cacheBrainBytes(bytes);
    return bytes;
  } catch (err) {
    const cached = getCachedBrainBytes();
    if (cached) {
      console.warn("[brain] using cached brain bytes", err);
      return cached;
    }
    console.warn("[brain] using embedded demo bytes", err);
    return FALLBACK_BYTES;
  }
}

function cacheBrainBytes(bytes) {
  try {
    const b64 = btoa(String.fromCharCode(...bytes));
    localStorage.setItem("xjson:lastBrain", b64);
  } catch (err) {
    console.warn("[brain] unable to cache brain bytes", err);
  }
}

function getCachedBrainBytes() {
  try {
    const b64 = localStorage.getItem("xjson:lastBrain");
    if (!b64) return null;
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.warn("[brain] unable to load cached brain bytes", err);
    return null;
  }
}

export function getLocalBrain() {
  return localBrain;
}

export function getHeat() {
  return { ...heat };
}

export function resetHeat() {
  heat.GRAM = 0.1;
  heat.EDGE = 0.1;
  heat.PATH = 0.1;
  heat.PROOF = 0.1;
}

function bumpHeat(lane, delta = 0.02) {
  heat[lane] = Math.min(1, heat[lane] + delta);
}

export function infer(graph, maxSteps = 32) {
  const edges = graph?.edges ?? [];
  let current = 0;
  const path = [current];

  for (let i = 0; i < maxSteps; i++) {
    bumpHeat("GRAM", 0.02);
    let best = null;
    let bestW = 0;

    for (const edge of edges) {
      if (edge.from === current && edge.w > bestW) {
        best = edge;
        bestW = edge.w;
      }
    }

    if (!best) break;

    bumpHeat("EDGE", 0.03);
    bumpHeat("PATH", 0.02);
    current = best.to;
    path.push(current);
  }

  return path;
}
