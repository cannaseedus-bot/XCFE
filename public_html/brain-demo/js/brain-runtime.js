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
    return new Uint8Array(buf);
  } catch (err) {
    console.warn("[brain] using embedded demo bytes", err);
    return FALLBACK_BYTES;
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
