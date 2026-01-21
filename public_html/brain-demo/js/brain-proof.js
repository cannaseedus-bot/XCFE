export async function emitProof(path, brainHash) {
  const pathHash = await sha256Hex(JSON.stringify(path));
  return {
    brain_hash: brainHash,
    path_hash: `sha256:${pathHash}`,
    steps: path.length,
    legal: true
  };
}

async function sha256Hex(input) {
  const data = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  const hashU8 = new Uint8Array(hashBuf);
  return [...hashU8].map((b) => b.toString(16).padStart(2, "0")).join("");
}
