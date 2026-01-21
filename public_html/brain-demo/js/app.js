import { loadBrain, infer, getHeat, resetHeat } from "./brain-runtime.js";
import { renderBrain } from "./brain-visualizer.js";
import { renderFederation } from "./brain-federation.js";
import { renderLaneHeat } from "./lane-heatmap.js";
import { emitProof } from "./brain-proof.js";
import { BrainP2P } from "./p2p.js";
import { decodeSCXQ2 } from "../wasm/scxq2_decoder.js";

const $ = (id) => document.getElementById(id);
const log = (s) => {
  $("p2pLog").textContent += s + "\n";
};

const federatedBrains = new Map();
const brainColors = ["#00ffcc", "#ff55aa", "#6ee7ff", "#ffd166", "#9b5de5"];

let localBrain = null;
let localBytes = null;
let localHash = "";
let layoutPositions = null;
let p2p = null;

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/brain-demo/sw.js");
  } catch (err) {
    console.warn("[sw] registration failed", err);
  }
}

async function init() {
  await registerServiceWorker();
  const { brain, bytes } = await loadBrain();
  localBrain = brain;
  localBytes = bytes;
  localHash = "sha256:" + (await sha256Hex(bytes));

  refreshBrainSelector();
  renderAll();
  setupP2P();

  $("btnInfer").addEventListener("click", runInfer);
  $("activeBrain").addEventListener("change", () => renderAll());
}

function refreshBrainSelector() {
  const select = $("activeBrain");
  select.innerHTML = "";

  const localOption = document.createElement("option");
  localOption.value = "local";
  localOption.textContent = "Local";
  select.appendChild(localOption);

  for (const [hash] of federatedBrains) {
    const option = document.createElement("option");
    option.value = hash;
    option.textContent = `Peer ${hash.slice(7, 15)}`;
    select.appendChild(option);
  }
}

function getActiveBrain() {
  const selected = $("activeBrain").value;
  if (selected === "local") return localBrain;
  return federatedBrains.get(selected)?.decoded ?? localBrain;
}

function getActiveBrainHash() {
  const selected = $("activeBrain").value;
  if (selected === "local") return localHash;
  return selected;
}

function renderAll(path = []) {
  if (!localBrain) return;
  const svg = $("brain-svg");
  const heat = getHeat();
  layoutPositions = renderBrain(svg, localBrain, path, { heat });

  const overlayBrains = [...federatedBrains.entries()].map(([hash, entry], i) => ({
    id: hash,
    color: entry.color,
    edges: entry.decoded?.edges ?? []
  }));

  renderFederation(svg, overlayBrains, layoutPositions);
  renderLaneHeat(svg, heat);
}

async function runInfer() {
  resetHeat();
  const graph = getActiveBrain();
  const path = infer(graph);
  const proof = await emitProof(path, getActiveBrainHash());

  $("output").textContent = JSON.stringify(
    { path, proof, active: $("activeBrain").value },
    null,
    2
  );

  renderAll(path);
}

async function cacheBrainInSW(hash, bytesU8) {
  if (!navigator.serviceWorker.controller) {
    log("[sw] no controller (reload after SW install)");
    return;
  }
  navigator.serviceWorker.controller.postMessage({
    t: "cache_brain_bin",
    cacheKey: `/brain-demo/brains/${hash}.bin`,
    bytes: bytesU8
  });
}

function addFederatedBrain(hash, bytes) {
  const color = brainColors[federatedBrains.size % brainColors.length];
  federatedBrains.set(hash, {
    bytes,
    decoded: decodeSCXQ2(bytes, null),
    color
  });
  refreshBrainSelector();
  renderAll();
}

function onBrainReceived({ name, hash, bytes }) {
  log(`[app] received full brain ${name} as ${hash}`);
  addFederatedBrain(hash, bytes);
  cacheBrainInSW(hash, bytes);
}

function setupP2P() {
  p2p = new BrainP2P({
    log,
    onBrainReceived,
    onOpen: () => {
      $("btnSendBrain").disabled = false;
    }
  });

  $("btnHost").onclick = async () => {
    const sdp = await p2p.host();
    $("localSDP").value = sdp;
    $("btnSendBrain").disabled = false;
  };

  $("btnJoin").onclick = async () => {
    await p2p.join();
    $("btnSendBrain").disabled = true;
  };

  $("btnSetRemote").onclick = async () => {
    await p2p.setRemoteSDP($("remoteSDP").value.trim());
    if (
      p2p.pc.localDescription?.type !== "answer" &&
      p2p.pc.remoteDescription?.type === "offer"
    ) {
      const ans = await p2p.createAnswer();
      $("localSDP").value = ans;
    }
  };

  $("btnCopyLocal").onclick = async () => {
    await navigator.clipboard.writeText($("localSDP").value);
    log("[ui] copied local SDP");
  };

  $("btnSendBrain").onclick = async () => {
    if (!localBytes) {
      log("[p2p] local brain bytes not loaded");
      return;
    }
    await p2p.sendBrainBinary(localBytes);
  };
}

async function sha256Hex(u8) {
  const hashBuf = await crypto.subtle.digest("SHA-256", u8.buffer);
  const hashU8 = new Uint8Array(hashBuf);
  return [...hashU8].map((b) => b.toString(16).padStart(2, "0")).join("");
}

init();
