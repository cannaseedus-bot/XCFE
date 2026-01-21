export const PROTO = {
  HELLO: "hello",
  WANT: "want",
  BRAIN_META: "brain-meta",
  BRAIN_DONE: "brain-done"
};

export const BIN = {
  MAGIC_BRAIN_CHUNK: 0x42
};

export function packChunk(chunkIndex, totalChunks, payloadU8) {
  const header = new Uint8Array(9);
  header[0] = BIN.MAGIC_BRAIN_CHUNK;
  new DataView(header.buffer).setUint32(1, chunkIndex, true);
  new DataView(header.buffer).setUint32(5, totalChunks, true);

  const out = new Uint8Array(9 + payloadU8.length);
  out.set(header, 0);
  out.set(payloadU8, 9);
  return out.buffer;
}

export function unpackChunk(buf) {
  const u8 = new Uint8Array(buf);
  if (u8[0] !== BIN.MAGIC_BRAIN_CHUNK) return null;
  const dv = new DataView(u8.buffer);
  const chunkIndex = dv.getUint32(1, true);
  const totalChunks = dv.getUint32(5, true);
  const payload = u8.slice(9);
  return { chunkIndex, totalChunks, payload };
}

export async function sha256Hex(u8) {
  const hashBuf = await crypto.subtle.digest("SHA-256", u8.buffer);
  const hashU8 = new Uint8Array(hashBuf);
  return [...hashU8].map((b) => b.toString(16).padStart(2, "0")).join("");
}
