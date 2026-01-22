import { PROTO, packChunk, unpackChunk, sha256Hex } from "./p2p-proto.js";

const ICE = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302"] },
    { urls: ["stun:stun1.l.google.com:19302"] }
  ]
};

export class BrainP2P {
  constructor({ log, onBrainReceived, onDeltaReceived, onOpen }) {
    this.log = log;
    this.onBrainReceived = onBrainReceived;
    this.onDeltaReceived = onDeltaReceived;
    this.onOpen = onOpen;

    this.pc = null;
    this.dc = null;

    this.rx = {
      meta: null,
      chunks: null,
      received: 0
    };
  }

  _l(msg) {
    this.log?.(msg);
  }

  async host() {
    await this._initPeer(true);
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    await this._waitIceGatheringComplete();
    this._l("[p2p] Host offer ready");
    return JSON.stringify(this.pc.localDescription);
  }

  async join() {
    await this._initPeer(false);
    this._l("[p2p] Joiner ready (paste offer, set remote, then create answer)");
  }

  async setRemoteSDP(sdpJson) {
    const desc = JSON.parse(sdpJson);
    await this.pc.setRemoteDescription(desc);
    this._l("[p2p] Remote SDP set");
  }

  async createAnswer() {
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    await this._waitIceGatheringComplete();
    this._l("[p2p] Answer ready");
    return JSON.stringify(this.pc.localDescription);
  }

  async _initPeer(isHost) {
    this.pc = new RTCPeerConnection(ICE);

    this.pc.oniceconnectionstatechange = () => {
      this._l(`[p2p] ICE state: ${this.pc.iceConnectionState}`);
    };

    if (isHost) {
      this.dc = this.pc.createDataChannel("brain", { ordered: true });
      this._wireDC();
    } else {
      this.pc.ondatachannel = (e) => {
        this.dc = e.channel;
        this._wireDC();
      };
    }
  }

  _wireDC() {
    this.dc.binaryType = "arraybuffer";

    this.dc.onopen = () => {
      this._l("[p2p] DataChannel open");
      this.sendJSON({ t: PROTO.HELLO, have: [] });
      this.onOpen?.();
    };

    this.dc.onclose = () => this._l("[p2p] DataChannel closed");
    this.dc.onerror = (e) =>
      this._l("[p2p] DataChannel error: " + (e?.message || e));

    this.dc.onmessage = async (evt) => {
      if (typeof evt.data === "string") {
        const msg = JSON.parse(evt.data);
        await this._handleJSON(msg);
      } else {
        await this._handleBIN(evt.data);
      }
    };
  }

  async _waitIceGatheringComplete() {
    if (this.pc.iceGatheringState === "complete") return;
    await new Promise((resolve) => {
      const check = () => {
        if (this.pc.iceGatheringState === "complete") {
          this.pc.removeEventListener("icegatheringstatechange", check);
          resolve();
        }
      };
      this.pc.addEventListener("icegatheringstatechange", check);
    });
  }

  sendJSON(obj) {
    if (!this.dc || this.dc.readyState !== "open") {
      throw new Error("DataChannel not open");
    }
    this.dc.send(JSON.stringify(obj));
  }

  async sendBrainBinary(u8, name = "brain.scxq2.bin") {
    const hash = "sha256:" + (await sha256Hex(u8));
    this._l(`[p2p] Sending brain ${name} (${u8.length} bytes) ${hash}`);

    this.sendJSON({ t: PROTO.BRAIN_META, name, size: u8.length, hash });

    const chunkSize = 16 * 1024;
    const totalChunks = Math.ceil(u8.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(u8.length, start + chunkSize);
      const payload = u8.slice(start, end);
      this.dc.send(packChunk(i, totalChunks, payload));

      if (this.dc.bufferedAmount > 4 * 1024 * 1024) {
        await new Promise((r) => setTimeout(r, 25));
      }
    }

    this.sendJSON({ t: PROTO.BRAIN_DONE, hash });
    this._l("[p2p] Brain send complete");
  }

  sendDeltaEdge({ from, to, w, lane = 1 }) {
    const ts = Date.now();
    this.sendJSON({ t: PROTO.DELTA, op: "edge_upsert", from, to, w, lane, ts });
  }

  async _handleJSON(msg) {
    switch (msg.t) {
      case PROTO.HELLO:
        this._l("[p2p] hello received");
        break;

      case PROTO.WANT:
        this._l("[p2p] want: " + msg.brain_hash);
        break;

      case PROTO.BRAIN_META:
        this._l(`[p2p] incoming brain: ${msg.name} ${msg.size} ${msg.hash}`);
        this.rx.meta = msg;
        this.rx.chunks = new Array(Math.ceil(msg.size / (16 * 1024))).fill(null);
        this.rx.received = 0;
        break;

      case PROTO.BRAIN_DONE:
        this._l(`[p2p] brain transfer done marker: ${msg.hash}`);
        break;

      case PROTO.DELTA:
        this._l(`[p2p] delta: ${msg.op} ${msg.from}->${msg.to} w=${msg.w}`);
        this.onDeltaReceived?.(msg);
        break;

      default:
        this._l("[p2p] unknown msg: " + msg.t);
    }
  }

  async _handleBIN(buf) {
    const frame = unpackChunk(buf);
    if (!frame) return;

    if (!this.rx.meta || !this.rx.chunks) {
      this._l("[p2p] got chunk but no meta yet");
      return;
    }

    this.rx.chunks[frame.chunkIndex] = frame.payload;
    this.rx.received++;

    if (this.rx.received === frame.totalChunks) {
      const total = this.rx.chunks.reduce((n, part) => n + part.length, 0);
      const u8 = new Uint8Array(total);
      let off = 0;
      for (const part of this.rx.chunks) {
        u8.set(part, off);
        off += part.length;
      }

      const hash = "sha256:" + (await sha256Hex(u8));
      if (hash !== this.rx.meta.hash) {
        this._l(
          `[p2p] HASH MISMATCH! expected=${this.rx.meta.hash} got=${hash}`
        );
        return;
      }

      this._l(`[p2p] Brain received OK (${u8.length} bytes) ${hash}`);
      this.onBrainReceived?.({ name: this.rx.meta.name, hash, bytes: u8 });

      this.rx.meta = null;
      this.rx.chunks = null;
      this.rx.received = 0;
    }
  }
}
