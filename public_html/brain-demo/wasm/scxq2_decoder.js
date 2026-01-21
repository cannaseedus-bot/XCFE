const FALLBACK_GRAPH = {
  gramCount: 12,
  edges: [
    { from: 0, to: 1, w: 0.6 },
    { from: 1, to: 2, w: 0.7 },
    { from: 2, to: 3, w: 0.9 },
    { from: 3, to: 4, w: 0.4 },
    { from: 4, to: 5, w: 0.5 },
    { from: 2, to: 6, w: 0.55 },
    { from: 6, to: 7, w: 0.8 },
    { from: 7, to: 8, w: 0.65 },
    { from: 1, to: 9, w: 0.35 },
    { from: 9, to: 10, w: 0.6 },
    { from: 10, to: 11, w: 0.3 },
    { from: 5, to: 11, w: 0.45 }
  ]
};

export const FALLBACK_BYTES = new TextEncoder().encode("SCXQ2-DEMO");

export async function loadSCXQ2() {
  try {
    const wasm = await WebAssembly.instantiateStreaming(
      fetch("wasm/scxq2_decoder.wasm")
    );
    return wasm.instance.exports;
  } catch (err) {
    console.warn("[scxq2] wasm decode unavailable, using fallback", err);
    return null;
  }
}

export function decodeSCXQ2(bytes, wasmExports) {
  if (wasmExports?.edge_count && wasmExports?.read_edge) {
    const edges = [];
    const total = wasmExports.edge_count();
    for (let i = 0; i < total; i++) {
      const edgePtr = wasmExports.read_edge(i);
      if (!edgePtr) continue;
      // Placeholder: real decoder should map wasm memory.
      edges.push({ from: 0, to: 0, w: 0 });
    }
    return {
      gramCount: wasmExports.gram_count?.() ?? FALLBACK_GRAPH.gramCount,
      edges: edges.length ? edges : FALLBACK_GRAPH.edges
    };
  }

  return {
    gramCount: FALLBACK_GRAPH.gramCount,
    edges: FALLBACK_GRAPH.edges,
    bytesLength: bytes?.length ?? 0
  };
}
