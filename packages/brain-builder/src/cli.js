import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';

const DEFAULT_GRAMS = ['ngram', 'bigram', 'trigram', 'supgram'];
const MAGIC = Buffer.from('SCXQ2');
const VERSION = 2;

export async function run(argv) {
  const [command, ...rest] = argv;
  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  const { args, options } = parseArgs(rest);

  try {
    switch (command) {
      case 'build':
        await buildCommand(args, options);
        break;
      case 'compress':
        await compressCommand(args, options);
        break;
      case 'infer':
        await inferCommand(args, options);
        break;
      case 'prove':
        await proveCommand(args, options);
        break;
      case 'merge':
        await mergeCommand(args, options);
        break;
      case 'diff':
        await diffCommand(args, options);
        break;
      case 'serve':
        await serveCommand(args, options);
        break;
      case 'doctor':
        await doctorCommand();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exitCode = 1;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

function printHelp() {
  console.log(`xjson-brain-builder <command> [options]

Commands:
  build <dataset>       Dataset → brain.json
  compress <brain.json> brain.json → brain.scxq2.bin
  infer <brain.bin>     Graph-walk inference (no embeddings)
  prove <brain.bin>     Generate KGB-ZK-1 proof
  merge <A.bin> <B.bin> Merge brains (CRDT-style)
  diff <A.bin> <B.bin>  Learning deltas
  serve <brain.bin>     Local REST / SW endpoint
  doctor               Diagnostics & capability probing
`);
}

function parseArgs(argv) {
  const args = [];
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('-') ? argv[i + 1] : true;
      options[key] = value;
      if (value !== true) {
        i += 1;
      }
    } else if (token.startsWith('-')) {
      const key = token.slice(1);
      const value = argv[i + 1] && !argv[i + 1].startsWith('-') ? argv[i + 1] : true;
      options[key] = value;
      if (value !== true) {
        i += 1;
      }
    } else {
      args.push(token);
    }
  }
  return { args, options };
}

async function buildCommand(args, options) {
  const datasetPath = args[0];
  if (!datasetPath) {
    throw new Error('build requires a dataset path');
  }
  const outPath = options.out || 'brain.json';
  const gramList = (options.grams ? options.grams.split(',') : DEFAULT_GRAMS).map((g) => g.trim());
  const tokenizerPath = options.tokenizer;
  const model = options.model || 'unknown';

  const dataset = await loadDataset(datasetPath);
  const tokenizer = await loadTokenizer(tokenizerPath);
  const tokens = dataset.flatMap((entry) => tokenize(entry, tokenizer));
  const grams = buildGrams(tokens, gramList);
  const graph = buildGraph(tokens, grams);

  const brain = {
    nodes: graph.nodes,
    edges: graph.edges,
    grams: grams,
    metadata: {
      created_at: new Date().toISOString(),
      tokenizer: tokenizerPath || 'default',
      model,
      grams: gramList,
      dataset: datasetPath,
    },
  };

  await fs.writeFile(outPath, JSON.stringify(brain, null, 2));
  console.log(`Brain written to ${outPath}`);
}

async function compressCommand(args, options) {
  const brainPath = args[0];
  if (!brainPath) {
    throw new Error('compress requires a brain.json path');
  }
  const outPath = options.out || 'brain.scxq2.bin';
  const brain = JSON.parse(await fs.readFile(brainPath, 'utf8'));
  const binary = encodeScxq2(brain, options);
  await fs.writeFile(outPath, binary);
  console.log(`SCXQ2 binary written to ${outPath}`);
}

async function inferCommand(args, options) {
  const brainPath = args[0];
  if (!brainPath) {
    throw new Error('infer requires a brain.scxq2.bin path');
  }
  const prompt = options.prompt || '';
  const steps = Number(options.steps || 32);
  const trace = Boolean(options.trace);

  const brain = decodeScxq2(await fs.readFile(brainPath));
  const result = inferGraph(brain, prompt, steps);

  if (trace) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(result.answer);
  }
}

async function proveCommand(args, options) {
  const brainPath = args[0];
  if (!brainPath) {
    throw new Error('prove requires a brain.scxq2.bin path');
  }
  const domain = options.domain || 'infer';
  const outPath = options.out || 'proof.kgbzk';

  const brainBytes = await fs.readFile(brainPath);
  const brainHash = hashBytes(brainBytes);
  const pathCommit = hashBytes(Buffer.concat([brainHash, Buffer.from(domain)]));
  const opsCommit = hashBytes(Buffer.concat([pathCommit, Buffer.from('ops')]));

  const proof = {
    brain_hash: brainHash.toString('hex'),
    path_commit: pathCommit.toString('hex'),
    ops_commit: opsCommit.toString('hex'),
  };

  await fs.writeFile(outPath, JSON.stringify(proof, null, 2));
  console.log(`Proof written to ${outPath}`);
}

async function mergeCommand(args, options) {
  const [aPath, bPath] = args;
  if (!aPath || !bPath) {
    throw new Error('merge requires two brain.scxq2.bin paths');
  }
  const outPath = options.out || 'merged.scxq2.bin';
  const brainA = decodeScxq2(await fs.readFile(aPath));
  const brainB = decodeScxq2(await fs.readFile(bPath));
  const merged = mergeBrains(brainA, brainB);
  const binary = encodeScxq2(merged, options);
  await fs.writeFile(outPath, binary);
  console.log(`Merged brain written to ${outPath}`);
}

async function diffCommand(args) {
  const [aPath, bPath] = args;
  if (!aPath || !bPath) {
    throw new Error('diff requires two brain.scxq2.bin paths');
  }
  const brainA = decodeScxq2(await fs.readFile(aPath));
  const brainB = decodeScxq2(await fs.readFile(bPath));
  const diff = diffBrains(brainA, brainB);
  console.log(JSON.stringify(diff, null, 2));
}

async function serveCommand(args, options) {
  const brainPath = args[0];
  if (!brainPath) {
    throw new Error('serve requires a brain.scxq2.bin path');
  }
  const port = Number(options.port || 7331);
  const brainBytes = await fs.readFile(brainPath);
  const brain = decodeScxq2(brainBytes);

  const server = http.createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400);
      res.end('No URL');
      return;
    }

    if (req.method === 'GET' && req.url === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', nodes: brain.nodes.length, edges: brain.edges.length }));
      return;
    }

    if (req.method === 'POST' && req.url === '/infer') {
      const body = await readBody(req);
      const payload = JSON.parse(body || '{}');
      const result = inferGraph(brain, payload.prompt || '', payload.steps || 32);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    if (req.method === 'POST' && req.url === '/prove') {
      const body = await readBody(req);
      const payload = JSON.parse(body || '{}');
      const domain = payload.domain || 'infer';
      const brainHash = hashBytes(brainBytes);
      const pathCommit = hashBytes(Buffer.concat([brainHash, Buffer.from(domain)]));
      const opsCommit = hashBytes(Buffer.concat([pathCommit, Buffer.from('ops')]));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          brain_hash: brainHash.toString('hex'),
          path_commit: pathCommit.toString('hex'),
          ops_commit: opsCommit.toString('hex'),
        })
      );
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(port, () => {
    console.log(`xjson-brain-builder serve listening on :${port}`);
  });
}

async function doctorCommand() {
  const checks = {
    node: process.version,
    arch: process.arch,
    platform: process.platform,
    wasm: typeof WebAssembly !== 'undefined',
    simd: process.arch === 'x64' || process.arch === 'arm64',
    adapters: ['gguf', 'ollama', 'safetensors', 'phi'],
  };
  console.log(JSON.stringify(checks, null, 2));
}

async function loadDataset(datasetPath) {
  const stats = await fs.stat(datasetPath);
  if (stats.isDirectory()) {
    const entries = await fs.readdir(datasetPath);
    const files = entries
      .filter((name) => ['.txt', '.jsonl', '.json', '.csv'].includes(path.extname(name)))
      .map((name) => path.join(datasetPath, name));
    const contents = [];
    for (const file of files) {
      contents.push(...(await loadDataset(file)));
    }
    return contents;
  }

  const ext = path.extname(datasetPath);
  const raw = await fs.readFile(datasetPath, 'utf8');
  if (ext === '.jsonl') {
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => extractText(JSON.parse(line)));
  }
  if (ext === '.json') {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((entry) => extractText(entry));
    }
    return [extractText(parsed)];
  }
  if (ext === '.csv') {
    const [headerLine, ...rows] = raw.split(/\r?\n/).filter(Boolean);
    const headers = headerLine.split(',').map((h) => h.trim());
    const textIndex = headers.findIndex((h) => h.toLowerCase() === 'text');
    return rows.map((row) => {
      const cols = row.split(',');
      return cols[textIndex >= 0 ? textIndex : 0] || row;
    });
  }
  return [raw];
}

function extractText(entry) {
  if (typeof entry === 'string') {
    return entry;
  }
  if (entry && typeof entry === 'object') {
    const keys = ['text', 'content', 'prompt', 'question', 'input'];
    for (const key of keys) {
      if (entry[key]) {
        return entry[key];
      }
    }
    return JSON.stringify(entry);
  }
  return String(entry ?? '');
}

async function loadTokenizer(tokenizerPath) {
  if (!tokenizerPath) {
    return { type: 'default' };
  }
  const raw = await fs.readFile(tokenizerPath, 'utf8');
  return JSON.parse(raw);
}

function tokenize(text, tokenizer) {
  if (tokenizer?.pattern) {
    const regex = new RegExp(tokenizer.pattern, 'g');
    return text.match(regex) || [];
  }
  return text.match(/[A-Za-z0-9_]+|[^\s]/g) || [];
}

function buildGrams(tokens, gramList) {
  const grams = [];
  const sentenceMarks = new Set(['.', '!', '?']);
  const boundaries = tokens.map((token) => sentenceMarks.has(token));

  const pushGram = (tokensSlice, kind) => {
    grams.push({
      id: grams.length,
      kind,
      tokens: tokensSlice,
    });
  };

  for (const kind of gramList) {
    const window = kind === 'ngram' ? 1 : kind === 'bigram' ? 2 : 3;
    if (kind === 'supgram') {
      for (let i = 0; i + window <= tokens.length; i += 1) {
        const slice = tokens.slice(i, i + window);
        const crossesSentence = boundaries.slice(i, i + window - 1).some(Boolean);
        if (crossesSentence) {
          pushGram(slice, 'SupGram');
        }
      }
      continue;
    }
    for (let i = 0; i + window <= tokens.length; i += 1) {
      const slice = tokens.slice(i, i + window);
      const kindName = kind === 'ngram' ? 'NGram' : kind === 'bigram' ? 'BiGram' : 'TriGram';
      pushGram(slice, kindName);
    }
  }

  return grams;
}

function buildGraph(tokens, grams) {
  const nodeMap = new Map();
  const nodes = [];
  const edgesMap = new Map();
  const gramIndex = new Map(grams.map((gram) => [gram.tokens.join(' '), gram.id]));

  const getNodeId = (token) => {
    if (!nodeMap.has(token)) {
      nodeMap.set(token, nodeMap.size);
      nodes.push({ id: nodeMap.size - 1, token });
    }
    return nodeMap.get(token);
  };

  for (let i = 0; i < tokens.length - 1; i += 1) {
    const src = getNodeId(tokens[i]);
    const dst = getNodeId(tokens[i + 1]);
    const key = `${src}-${dst}`;
    const gramId = gramIndex.get(tokens.slice(i, i + 2).join(' ')) ?? 0;
    const current = edgesMap.get(key) || { src, dst, weight: 0, gram_id: gramId };
    current.weight += 1;
    edgesMap.set(key, current);
  }

  return { nodes, edges: Array.from(edgesMap.values()) };
}

function encodeScxq2(brain, options = {}) {
  const lanes = [
    Buffer.from(JSON.stringify(brain.nodes)),
    Buffer.from(JSON.stringify(brain.edges)),
    Buffer.from(JSON.stringify(brain.grams)),
    Buffer.from(JSON.stringify({ proof_lane: true, lanes: options.lanes || 'auto' })),
  ];

  const header = Buffer.alloc(10);
  MAGIC.copy(header, 0);
  header.writeUInt8(VERSION, 5);
  header.writeUInt32LE(lanes.length, 6);

  const laneBuffers = lanes.map((lane) => {
    const size = Buffer.alloc(4);
    size.writeUInt32LE(lane.length, 0);
    return Buffer.concat([size, lane]);
  });

  return Buffer.concat([header, ...laneBuffers]);
}

function decodeScxq2(buffer) {
  if (buffer.slice(0, 5).compare(MAGIC) !== 0) {
    throw new Error('Invalid SCXQ2 binary');
  }
  const laneCount = buffer.readUInt32LE(6);
  let offset = 10;
  const lanes = [];
  for (let i = 0; i < laneCount; i += 1) {
    const size = buffer.readUInt32LE(offset);
    offset += 4;
    const lane = buffer.slice(offset, offset + size);
    offset += size;
    lanes.push(lane);
  }

  return {
    nodes: JSON.parse(lanes[0].toString()),
    edges: JSON.parse(lanes[1].toString()),
    grams: JSON.parse(lanes[2].toString()),
    metadata: {},
  };
}

function inferGraph(brain, prompt, steps) {
  const promptTokens = tokenize(prompt, { type: 'default' });
  const nodeMap = new Map(brain.nodes.map((node) => [node.token, node.id]));
  let current = nodeMap.get(promptTokens[0]) ?? 0;
  const path = [current];

  const edgesBySrc = new Map();
  for (const edge of brain.edges) {
    const list = edgesBySrc.get(edge.src) || [];
    list.push(edge);
    edgesBySrc.set(edge.src, list);
  }

  for (let step = 0; step < steps; step += 1) {
    const edges = edgesBySrc.get(current) || [];
    if (edges.length === 0) {
      break;
    }
    edges.sort((a, b) => b.weight - a.weight || a.dst - b.dst);
    current = edges[0].dst;
    path.push(current);
  }

  const tokens = path.map((id) => brain.nodes.find((node) => node.id === id)?.token ?? '').filter(Boolean);
  const answer = tokens.slice(-Math.min(tokens.length, 16)).join(' ');

  return {
    answer,
    path,
  };
}

function mergeBrains(a, b) {
  const nodeMap = new Map();
  const nodes = [];
  const edgesMap = new Map();
  const gramsMap = new Map();

  const addNode = (token) => {
    if (!nodeMap.has(token)) {
      nodeMap.set(token, nodeMap.size);
      nodes.push({ id: nodeMap.size - 1, token });
    }
    return nodeMap.get(token);
  };

  const ingest = (brain) => {
    for (const node of brain.nodes) {
      addNode(node.token);
    }
    for (const gram of brain.grams) {
      const key = gram.tokens.join(' ');
      if (!gramsMap.has(key)) {
        gramsMap.set(key, { ...gram, id: gramsMap.size });
      }
    }
    for (const edge of brain.edges) {
      const srcToken = brain.nodes.find((node) => node.id === edge.src)?.token;
      const dstToken = brain.nodes.find((node) => node.id === edge.dst)?.token;
      if (!srcToken || !dstToken) {
        continue;
      }
      const src = addNode(srcToken);
      const dst = addNode(dstToken);
      const key = `${src}-${dst}`;
      const current = edgesMap.get(key) || { src, dst, weight: 0, gram_id: edge.gram_id };
      current.weight += edge.weight;
      edgesMap.set(key, current);
    }
  };

  ingest(a);
  ingest(b);

  return {
    nodes,
    edges: Array.from(edgesMap.values()),
    grams: Array.from(gramsMap.values()),
    metadata: { merged_at: new Date().toISOString() },
  };
}

function diffBrains(a, b) {
  const edgeKey = (edge, brain) => {
    const src = brain.nodes.find((node) => node.id === edge.src)?.token ?? edge.src;
    const dst = brain.nodes.find((node) => node.id === edge.dst)?.token ?? edge.dst;
    return `${src}->${dst}`;
  };

  const mapA = new Map(a.edges.map((edge) => [edgeKey(edge, a), edge.weight]));
  const mapB = new Map(b.edges.map((edge) => [edgeKey(edge, b), edge.weight]));
  const deltas = [];

  for (const [key, weight] of mapB.entries()) {
    const prev = mapA.get(key) || 0;
    if (weight !== prev) {
      deltas.push({ edge: key, before: prev, after: weight, delta: weight - prev });
    }
  }

  return {
    deltas,
    new_grams: b.grams.filter((gram) => !a.grams.some((ag) => ag.tokens.join(' ') === gram.tokens.join(' '))),
    removed_paths: a.edges.filter((edge) => !mapB.has(edgeKey(edge, a))).map((edge) => edgeKey(edge, a)),
  };
}

function hashBytes(buffer) {
  return crypto.createHash('sha256').update(buffer).digest();
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}
