import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

type SeedLabelMap = Map<string, string>;
type KeyStats = { count: number; examples: Set<string> };

// tsx/esbuild may run this script in CJS mode; rely on __dirname.
// eslint-disable-next-line no-underscore-dangle
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BACKEND_SEED_PATH = path.join(REPO_ROOT, 'src', 'CatalogService', 'Data', 'CatalogDbContext.cs');
const XCORE_PRODUCTS_PATH = path.join(REPO_ROOT, 'scripts', 'scraper', 'data', 'xcore-products.json');
const XCORE_FILTER_ATTRS_PATH = path.join(REPO_ROOT, 'scripts', 'scraper', 'config', 'xcore-filter-attributes.json');
const ALL_FILTERS_DUMP_PATH = path.join(REPO_ROOT, 'scripts', 'scraper', 'data', 'all-filters-dump.json');
const OUT_TS_PATH = path.join(REPO_ROOT, 'src', 'frontend', 'src', 'utils', 'specLabels.generated.ts');

function fallbackLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function parseSeedLabels(source: string): SeedLabelMap {
  const map: SeedLabelMap = new Map();
  const objRe = /new\s+SpecificationAttribute\s*\{([\s\S]*?)\}\s*,?/g;

  for (const m of source.matchAll(objRe)) {
    const block = m[1] ?? '';
    const key = block.match(/\bKey\s*=\s*"([^"]+)"/)?.[1];
    const displayName = block.match(/\bDisplayName\s*=\s*"([^"]+)"/)?.[1];
    if (!key || !displayName) continue;
    map.set(key, displayName);
  }

  return map;
}

function readFilterAttributesMap(filePath: string): SeedLabelMap {
  if (!fs.existsSync(filePath)) return new Map();
  const raw = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(raw) as unknown;

  const map: SeedLabelMap = new Map();

  // supports two formats:
  // 1) { gpu: [{ attribute_key, display_name, ... }], ... }
  // 2) { categories: { processors: { attributes: [{ key, displayName, ... }] } } }
  if (typeof json === 'object' && json != null) {
    const any = json as Record<string, unknown>;

    if (typeof any.categories === 'object' && any.categories != null) {
      const categories = any.categories as Record<string, unknown>;
      for (const cat of Object.values(categories)) {
        const attrs = (cat as any)?.attributes as unknown;
        if (!Array.isArray(attrs)) continue;
        for (const a of attrs as any[]) {
          const key = String(a?.key ?? '').trim();
          const displayName = String(a?.displayName ?? '').trim();
          if (key && displayName) map.set(key, displayName);
        }
      }
      return map;
    }

    for (const v of Object.values(any)) {
      if (!Array.isArray(v)) continue;
      for (const a of v as any[]) {
        const key = String(a?.attribute_key ?? '').trim();
        const displayName = String(a?.display_name ?? '').trim();
        if (key && displayName) map.set(key, displayName);
      }
    }
  }

  return map;
}

function pushExample(stats: KeyStats, value: string): void {
  if (stats.examples.size >= 3) return;
  const v = value.trim();
  if (!v) return;
  stats.examples.add(v.length > 80 ? v.slice(0, 77) + '…' : v);
}

function getOrInit(stats: Map<string, KeyStats>, key: string): KeyStats {
  const existing = stats.get(key);
  if (existing) return existing;
  const created: KeyStats = { count: 0, examples: new Set() };
  stats.set(key, created);
  return created;
}

function isWhitespace(ch: number): boolean {
  return ch === 0x20 || ch === 0x0a || ch === 0x0d || ch === 0x09;
}

function readString(buf: Buffer, start: number): { value: string; next: number } {
  // start points at opening quote
  let i = start + 1;
  let out = '';
  while (i < buf.length) {
    const c = buf[i];
    if (c === 0x22) {
      return { value: out, next: i + 1 };
    }
    if (c === 0x5c) {
      const n = buf[i + 1];
      if (n === undefined) break;
      // minimal escape handling
      if (n === 0x22) out += '"';
      else if (n === 0x5c) out += '\\';
      else if (n === 0x6e) out += '\n';
      else if (n === 0x72) out += '\r';
      else if (n === 0x74) out += '\t';
      else out += String.fromCharCode(n);
      i += 2;
      continue;
    }
    out += String.fromCharCode(c);
    i++;
  }
  return { value: out, next: i };
}

function skipValue(buf: Buffer, start: number): number {
  let i = start;
  while (i < buf.length && isWhitespace(buf[i])) i++;
  const c = buf[i];
  if (c === 0x22) {
    const { next } = readString(buf, i);
    return next;
  }
  if (c === 0x7b) {
    // object
    let depth = 0;
    while (i < buf.length) {
      const ch = buf[i];
      if (ch === 0x22) {
        const { next } = readString(buf, i);
        i = next;
        continue;
      }
      if (ch === 0x7b) depth++;
      if (ch === 0x7d) {
        depth--;
        i++;
        if (depth <= 0) return i;
        continue;
      }
      i++;
    }
    return i;
  }
  if (c === 0x5b) {
    // array
    let depth = 0;
    while (i < buf.length) {
      const ch = buf[i];
      if (ch === 0x22) {
        const { next } = readString(buf, i);
        i = next;
        continue;
      }
      if (ch === 0x5b) depth++;
      if (ch === 0x5d) {
        depth--;
        i++;
        if (depth <= 0) return i;
        continue;
      }
      i++;
    }
    return i;
  }
  // number/true/false/null
  while (i < buf.length) {
    const ch = buf[i];
    if (ch === 0x2c || ch === 0x7d || ch === 0x5d) return i;
    i++;
  }
  return i;
}

function readPrimitivePreview(buf: Buffer, start: number): { preview: string; next: number } {
  let i = start;
  while (i < buf.length && isWhitespace(buf[i])) i++;
  const c = buf[i];
  if (c === 0x22) {
    const { value, next } = readString(buf, i);
    return { preview: value, next };
  }
  const end = skipValue(buf, i);
  const preview = buf.slice(i, Math.min(end, i + 80)).toString('utf8').trim();
  return { preview, next: end };
}

async function collectKeysFromXcoreProducts(filePath: string): Promise<Map<string, KeyStats>> {
  const stats = new Map<string, KeyStats>();

  // Stream by lines to keep memory low, but parse the `"specifications": { ... }` block by a small state machine.
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let inSpecs = false;
  let braceDepth = 0;
  let carry = '';

  for await (const line of rl) {
    const chunk = carry + line + '\n';
    carry = '';

    // Convert to Buffer for byte-level parsing
    const buf = Buffer.from(chunk, 'utf8');
    let i = 0;

    while (i < buf.length) {
      if (!inSpecs) {
        // Find `"specifications": {`
        const idx = chunk.indexOf('"specifications"', i);
        if (idx === -1) break;
        const after = chunk.indexOf('{', idx);
        if (after === -1) break;
        inSpecs = true;
        braceDepth = 1;
        i = after + 1;
        continue;
      }

      // We are inside the specifications object. Parse keys at depth 1: "key": value
      const ch = buf[i];
      if (ch === 0x22) {
        const { value: key, next } = readString(buf, i);
        i = next;

        // Skip whitespace and colon
        while (i < buf.length && isWhitespace(buf[i])) i++;
        if (buf[i] !== 0x3a) continue; // not a key in object
        i++; // colon

        const { preview, next: afterVal } = readPrimitivePreview(buf, i);
        i = afterVal;

        const st = getOrInit(stats, key);
        st.count += 1;
        pushExample(st, preview);
        continue;
      }

      if (ch === 0x7b) {
        braceDepth++;
        i++;
        continue;
      }
      if (ch === 0x7d) {
        braceDepth--;
        i++;
        if (braceDepth <= 0) {
          inSpecs = false;
          braceDepth = 0;
        }
        continue;
      }
      if (ch === 0x0a || ch === 0x0d) {
        i++;
        continue;
      }
      i++;
    }

    // If specs block spans lines, keep some tail to avoid losing `"specifications"` split.
    if (!inSpecs && chunk.length > 64) {
      carry = chunk.slice(-64);
    }
  }

  return stats;
}

function mergeLabels(seed: SeedLabelMap, filters: SeedLabelMap, xcore: Map<string, KeyStats>): Record<string, string> {
  const keys = new Set<string>([...seed.keys(), ...filters.keys(), ...xcore.keys()]);
  const out: Record<string, string> = {};

  const sorted = Array.from(keys).sort((a, b) => a.localeCompare(b));
  for (const key of sorted) {
    // Priority: backend seed (authoritative) -> filter dumps (usually RU) -> fallback
    out[key] = seed.get(key) ?? filters.get(key) ?? fallbackLabel(key);
  }
  return out;
}

function renderTs(labels: Record<string, string>): string {
  const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
  const lines = entries.map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
  return `/* eslint-disable */\n` +
    `// This file is auto-generated by scripts/specs/generateSpecLabels.ts\n` +
    `// Do not edit by hand.\n\n` +
    `export const SPEC_LABELS_GENERATED: Record<string, string> = {\n` +
    `${lines.join('\n')}\n` +
    `};\n`;
}

async function main(): Promise<void> {
  if (!fs.existsSync(BACKEND_SEED_PATH)) {
    throw new Error(`Seed file not found: ${BACKEND_SEED_PATH}`);
  }
  if (!fs.existsSync(XCORE_PRODUCTS_PATH)) {
    throw new Error(`XCore products file not found: ${XCORE_PRODUCTS_PATH}`);
  }

  const seedSource = fs.readFileSync(BACKEND_SEED_PATH, 'utf8');
  const seed = parseSeedLabels(seedSource);
  const filters = new Map<string, string>([
    ...readFilterAttributesMap(XCORE_FILTER_ATTRS_PATH).entries(),
    ...readFilterAttributesMap(ALL_FILTERS_DUMP_PATH).entries(),
  ]);
  const xcoreStats = await collectKeysFromXcoreProducts(XCORE_PRODUCTS_PATH);

  const labels = mergeLabels(seed, filters, xcoreStats);
  const ts = renderTs(labels);

  fs.mkdirSync(path.dirname(OUT_TS_PATH), { recursive: true });
  fs.writeFileSync(OUT_TS_PATH, ts, 'utf8');

  // Minimal console output (useful in CI)
  // eslint-disable-next-line no-console
  console.log(`Generated ${Object.keys(labels).length} labels -> ${OUT_TS_PATH}`);
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

