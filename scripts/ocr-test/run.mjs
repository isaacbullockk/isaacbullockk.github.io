/**
 * OCR multi-pass harness (dev-only, not shipped).
 *
 * Bundles src/lib/ocr.ts with esbuild, then runs the REAL multi-pass pipeline
 * (buildOcrPasses → worker.recognize per pass → collectWords → mergeWordBoxes
 * → messagesFromWords, via the exported detectMessagesInPixels core) against
 * synthetic PIL screenshots, using real tesseract.js in Node with the
 * vendored public/tesseract/ language assets (cacheMethod: 'none').
 *
 * Usage:
 *   node scripts/ocr-test/run.mjs            # multi-pass, all styles
 *   node scripts/ocr-test/run.mjs --baseline # single luminance pass (the old bug)
 */
import { createWorker } from 'tesseract.js';
import { deflateSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const TESS = path.join(ROOT, 'public/tesseract');

const ocr = await import(path.join(HERE, 'out/ocr.bundle.mjs'));

/* ---------------- minimal PNG encoder (RGBA, filter 0) ---------------- */
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function encodePng({ data, width, height }) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    Buffer.from(data.buffer, data.byteOffset + y * width * 4, width * 4).copy(
      raw, y * (width * 4 + 1) + 1,
    );
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------ scoring ------------------------------- */
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function lev(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
const sim = (a, b) => {
  const x = norm(a), y = norm(b);
  if (!x && !y) return 1;
  return 1 - lev(x, y) / Math.max(x.length, y.length, 1);
};

/* -------------------------------- main -------------------------------- */
const baseline = process.argv.includes('--baseline');
// --full8 forces all 8 preprocessing passes (skips the early-exit gate), so
// its timing is the before/after comparison point for the early-exit fix.
const full8 = process.argv.includes('--full8');
const styles = process.argv.includes('--style')
  ? [process.argv[process.argv.indexOf('--style') + 1]]
  : ['imessage-light', 'imessage-sms-green', 'whatsapp-dark', 'instagram-dark'];

const worker = await createWorker('eng', 1 /* OEM.LSTM_ONLY */, {
  langPath: TESS,
  gzip: true,
  cacheMethod: 'none',
  cacheMethodWrite: false,
});

let allPass = true;
for (const style of styles) {
  const meta = JSON.parse(readFileSync(`${HERE}/test-images/${style}.json`, 'utf8'));
  const raw = readFileSync(`${HERE}/test-images/${style}.rgba`);
  const pixels = {
    data: new Uint8ClampedArray(raw.buffer, raw.byteOffset, raw.length),
    width: meta.width,
    height: meta.height,
  };

  const t0 = Date.now();
  let found;
  let passesRun = 1;
  if (baseline) {
    // The old single-pass behavior: luminance grayscale only.
    const pass = ocr.buildOcrPasses(pixels).find((p) => p.name === 'lum');
    const { data } = await worker.recognize(encodePng(pass.pixels), {}, { blocks: true });
    found = ocr.messagesFromPage(data, meta.width, meta.height, 0, 't');
  } else if (full8) {
    // Early-exit bypassed: run every derived pass explicitly.
    const passes = ocr.buildOcrPasses(pixels);
    const perPass = [];
    for (const pass of passes) {
      const { data } = await worker.recognize(encodePng(pass.pixels), {}, { blocks: true });
      perPass.push(ocr.collectWords(data));
    }
    passesRun = passes.length;
    found = ocr.messagesFromWords(
      ocr.mergeWordBoxes(perPass), meta.width, meta.height, 0, 't');
  } else {
    let lastPass = 0;
    found = await ocr.detectMessagesInPixels(pixels, 0, 't', async (pass) => {
      const { data } = await worker.recognize(encodePng(pass.pixels), {}, { blocks: true });
      return data;
    }, (idx) => {
      lastPass = idx;
    });
    passesRun = lastPass + 1;
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  const exp = meta.expected;
  const herN = found.filter((m) => m.sender === 'her').length;
  const youN = found.filter((m) => m.sender === 'you').length;
  const expHer = exp.filter((m) => m.sender === 'her').length;
  const expYou = exp.filter((m) => m.sender === 'you').length;

  let sims = [];
  let senderOK = found.length === exp.length;
  for (let i = 0; i < Math.max(found.length, exp.length); i++) {
    const f = found[i], e = exp[i];
    if (!f || !e) { senderOK = false; continue; }
    if (f.sender !== e.sender) senderOK = false;
    sims.push(sim(f.text, e.text));
  }
  const avgSim = sims.length ? sims.reduce((a, b) => a + b, 0) / sims.length : 0;
  const bothSides = herN > 0 && youN > 0;
  const ok = bothSides && senderOK && avgSim >= 0.7;
  allPass = allPass && ok;

  const modeTag = baseline
    ? '[BASELINE single lum pass]'
    : full8
      ? '[FULL 8-PASS, early-exit off]'
      : `[MULTI-PASS, ${passesRun}/8 passes used${passesRun === 1 ? ' — early exit' : ''}]`;
  console.log(`\n=== ${style} ${modeTag} (${secs}s) ===`);
  console.log(`extracted ${found.length} (her ${herN} / you ${youN}) — expected ${exp.length} (her ${expHer} / you ${expYou})`);
  console.log(`senders ${senderOK ? 'MATCH' : 'MISMATCH'} | both sides ${bothSides ? 'yes' : 'NO'} | avg text similarity ${(avgSim * 100).toFixed(1)}%`);
  for (let i = 0; i < Math.max(found.length, exp.length); i++) {
    const f = found[i], e = exp[i];
    const s = f && e ? (sim(f.text, e.text) * 100).toFixed(0) + '%' : '  —';
    console.log(`  [${f?.sender ?? '?'}] ${f?.text ?? '<missing>'}`);
    console.log(`      exp[${e?.sender ?? '?'}] ${e?.text ?? '<none>'}  (${s})`);
  }
  console.log(ok ? `PASS ${style}` : `FAIL ${style}`);
}

await worker.terminate();
console.log(`\n${allPass ? 'ALL STYLES PASS' : 'SOME STYLES FAILED'}`);
process.exit(allPass ? 0 : 1);
