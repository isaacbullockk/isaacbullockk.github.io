/**
 * Client-side screenshot → chat-thread extraction.
 *
 * tesseract.js is loaded lazily (dynamic import) the first time the user reads
 * a screenshot, and the worker / WASM core / language data are vendored under
 * `public/tesseract/` so OCR runs fully offline and nothing leaves the device.
 *
 * Multi-pass preprocessing: a single luminance-grayscale pass silently loses
 * white text on saturated colored bubbles (iMessage blue/green, Instagram
 * purple) — tesseract emits zero words for those regions. So each screenshot
 * is OCR'd under several derived grayscale images (luminance, individual RGB
 * channels, and their inversions — white text on a blue bubble has extreme
 * contrast in the red channel, on a purple bubble in the green channel, etc.)
 * and the word results are UNIONED, deduping overlapping boxes by IoU and
 * keeping the highest-confidence reading.
 *
 * Geometry heuristic: OCR words (with bounding boxes) are grouped into lines,
 * noise lines (status bar, name header, timestamps, "typing…") are dropped,
 * and remaining lines are clustered into message bubbles by vertical proximity
 * and horizontal alignment. Standard chat layout puts your bubbles on the
 * right half of the screen and hers on the left — the sender is assigned from
 * which half anchors the bubble. Results are imperfect by nature; the Co-Pilot
 * always shows an editable review step before analysis.
 */

import type { ChatMessage } from '@/lib/engine';

export interface OcrProgress {
  /** 1-based index of the image currently being read. */
  image: number;
  total: number;
  /** 0–100 overall. */
  percent: number;
}

export interface DetectedMessage extends ChatMessage {
  id: string;
  /** Index of the screenshot this bubble came from. */
  imageIndex: number;
}

interface WordBox {
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  confidence: number;
}

interface LineBox {
  words: WordBox[];
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  height: number;
  centerX: number;
}

/** Raw RGBA pixels — the DOM-free interchange format for preprocessing. */
export interface PixelImage {
  data: Uint8ClampedArray<ArrayBuffer>;
  width: number;
  height: number;
}

/** One derived grayscale image handed to tesseract in a multi-pass read. */
export interface OcrPass {
  name: string;
  pixels: PixelImage;
}

/**
 * Absolute URL of the vendored tesseract assets. Resolved against this
 * chunk's own URL (…/assets/ocr-*.js → <base>/tesseract/) so it works from
 * any SPA route and under any deploy base; in dev, public/ is served at root.
 */
const TESS_BASE = import.meta.env.DEV
  ? new URL('/tesseract/', window.location.origin).href
  : new URL('../tesseract/', import.meta.url).href;

const CLOCK = /\b\d{1,2}:\d{2}\b/;
/**
 * Day/time separator pills ("Today 8:15 PM", "Mon, Sep 2, 7:44 PM",
 * "Wed 12:04", "Sep 2"). Anchored at line start and requiring a clock or
 * date shape, so a real message like "thursday then? i know a spot" survives.
 */
const SEPARATOR = new RegExp(
  '^(?:' +
    '(?:today|yesterday)\\b' +
    '|(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*[,.]?\\s+(?:\\d{1,2}:\\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))' +
    '|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?\\s+\\d{1,2}' +
    '|\\d{1,2}:\\d{2}' +
    ')',
  'i',
);
const TYPING = /typing|^\s*[.…]{2,}\s*$/i;
/** Words with at least one letter/digit (keeps "ha!", "2nite"; drops OCR glyph noise). */
const REAL_WORD = /[a-z0-9]/i;

/** Merge two word boxes with IoU above this into a single reading. */
const MERGE_IOU = 0.5;
/**
 * Confidence gap (points) under which two overlapping readings are a tie —
 * the longer text wins, preserving trailing punctuation ("really!" vs
 * "really") that a pass sometimes clips.
 */
const CONF_TIE = 12;

/* --------------------------- multi-pass pixels ---------------------------- */

function toGray(
  img: PixelImage,
  pick: (r: number, g: number, b: number) => number,
  invert: boolean,
): PixelImage {
  const { data, width, height } = img;
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    let v = Math.round(pick(data[i], data[i + 1], data[i + 2]));
    if (invert) v = 255 - v;
    out[i] = v;
    out[i + 1] = v;
    out[i + 2] = v;
    out[i + 3] = 255;
  }
  return { data: out, width, height };
}

const LUMINANCE = (r: number, g: number, b: number) => r * 0.299 + g * 0.587 + b * 0.114;

/**
 * Derive the grayscale variants OCR runs over. Colored chat bubbles carry
 * white text that vanishes under plain luminance (blue bubble ≈ mid-gray,
 * white ≈ high — tesseract's global binarization emits nothing), while the
 * same text has near-maximal contrast in at least one raw RGB channel
 * (blue bubble → red channel ≈ black; green bubble → red/blue channels;
 * purple bubble → green channel). Each variant is also run inverted, because
 * tesseract wants dark text on light ground and a mixed-polarity screenshot
 * can only serve one side per polarity. Word boxes from all passes are
 * unioned afterwards, so redundant passes cost time, not accuracy.
 */
export function buildOcrPasses(img: PixelImage): OcrPass[] {
  const channels: [string, (r: number, g: number, b: number) => number][] = [
    ['lum', LUMINANCE],
    ['r', (r) => r],
    ['g', (_r, g) => g],
    ['b', (_r, _g, b) => b],
  ];
  const passes: OcrPass[] = [];
  for (const [name, pick] of channels) {
    passes.push({ name, pixels: toGray(img, pick, false) });
    passes.push({ name: `${name}-inv`, pixels: toGray(img, pick, true) });
  }
  return passes;
}

/* ------------------------------ word merging ------------------------------ */

function iou(a: WordBox, b: WordBox): number {
  const x0 = Math.max(a.x0, b.x0);
  const y0 = Math.max(a.y0, b.y0);
  const x1 = Math.min(a.x1, b.x1);
  const y1 = Math.min(a.y1, b.y1);
  if (x1 <= x0 || y1 <= y0) return 0;
  const inter = (x1 - x0) * (y1 - y0);
  const area = (w: WordBox) => (w.x1 - w.x0) * (w.y1 - w.y0);
  return inter / (area(a) + area(b) - inter);
}

/**
 * Union word boxes from multiple OCR passes: boxes that overlap heavily
 * (IoU > 0.5) are the same physical word — keep the highest-confidence
 * reading, EXCEPT on a near-tie (≤ 12 confidence points), where the longer
 * text wins so punctuation-rich readings ("wait, what?!") aren't discarded
 * for a clipped twin. Greedy best-first so a strong reading claims its
 * territory before weaker duplicates from other passes.
 */
export function mergeWordBoxes(perPass: WordBox[][]): WordBox[] {
  const all = perPass.flat().sort((a, b) => b.confidence - a.confidence);
  const kept: WordBox[] = [];
  for (const w of all) {
    const dup = kept.findIndex((k) => iou(k, w) > MERGE_IOU);
    if (dup === -1) {
      kept.push(w);
      continue;
    }
    const k = kept[dup];
    if (k.confidence - w.confidence <= CONF_TIE && w.text.length > k.text.length) {
      kept[dup] = w;
    }
  }
  return kept;
}

/* --------------------------- tesseract plumbing --------------------------- */

async function loadWorker(onRecognizeProgress: (fraction: number) => void) {
  const Tesseract = await import('tesseract.js');
  const worker = await Tesseract.createWorker('eng', Tesseract.OEM.LSTM_ONLY, {
    workerPath: `${TESS_BASE}worker.min.js`,
    corePath: `${TESS_BASE}tesseract-core-lstm.wasm.js`,
    langPath: TESS_BASE,
    gzip: true,
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onRecognizeProgress(m.progress);
      }
    },
  });
  return worker;
}

/** Flatten tesseract's block hierarchy into filtered word boxes. */
export function collectWords(data: unknown): WordBox[] {
  const words: WordBox[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const n = node as Record<string, unknown>;
    if (Array.isArray(n.words)) {
      for (const w of n.words as Record<string, unknown>[]) {
        const bbox = w.bbox as { x0: number; y0: number; x1: number; y1: number } | undefined;
        const text = String(w.text ?? '').trim();
        if (!bbox || !text) continue;
        words.push({
          text,
          x0: bbox.x0,
          y0: bbox.y0,
          x1: bbox.x1,
          y1: bbox.y1,
          confidence: Number(w.confidence ?? 0),
        });
      }
      return;
    }
    for (const key of ['blocks', 'paragraphs', 'lines'] as const) {
      if (Array.isArray(n[key])) (n[key] as unknown[]).forEach(walk);
    }
  };
  walk(data);
  return words.filter((w) => w.confidence >= 25 && REAL_WORD.test(w.text));
}

/** Group word boxes into visual line boxes (sort by vertical center, cluster). */
function groupLines(words: WordBox[]): LineBox[] {
  if (words.length === 0) return [];

  const heights = words.map((w) => w.y1 - w.y0).sort((a, b) => a - b);
  const medH = heights[Math.floor(heights.length / 2)] || 12;
  const sorted = [...words].sort((a, b) => (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2);

  const lines: WordBox[][] = [];
  for (const w of sorted) {
    const cy = (w.y0 + w.y1) / 2;
    const line = lines[lines.length - 1];
    if (line) {
      const ly0 = Math.min(...line.map((x) => x.y0));
      const ly1 = Math.max(...line.map((x) => x.y1));
      const lcy = (ly0 + ly1) / 2;
      if (Math.abs(cy - lcy) <= medH * 0.7) {
        line.push(w);
        continue;
      }
    }
    lines.push([w]);
  }

  return lines.map((ws) => {
    const ordered = [...ws].sort((a, b) => a.x0 - b.x0);
    const x0 = Math.min(...ordered.map((w) => w.x0));
    const y0 = Math.min(...ordered.map((w) => w.y0));
    const x1 = Math.max(...ordered.map((w) => w.x1));
    const y1 = Math.max(...ordered.map((w) => w.y1));
    return {
      words: ordered,
      text: ordered.map((w) => w.text).join(' '),
      x0,
      y0,
      x1,
      y1,
      height: y1 - y0,
      centerX: (x0 + x1) / 2,
    };
  });
}

/** Drop status bars, name/presence headers, timestamp separators, typing dots. */
function isNoiseLine(line: LineBox, imgW: number, imgH: number, index: number): boolean {
  const topBand = line.y1 < imgH * 0.05;
  const centered = Math.abs(line.centerX - imgW / 2) < imgW * 0.18;

  // Phone status bar (time / carrier / battery row at the very top).
  if (topBand && (line.text.length <= 20 || CLOCK.test(line.text))) return true;
  // Contact name + presence header, centered near the top of the chat.
  if (index <= 2 && line.y0 < imgH * 0.16 && centered) return true;
  // Day/time separator pills: genuinely centered (tight) and date-shaped.
  const tightCenter = Math.abs(line.centerX - imgW / 2) < imgW * 0.1;
  if (tightCenter && line.text.length <= 34 && SEPARATOR.test(line.text)) return true;
  // "typing…" indicator.
  if (TYPING.test(line.text)) return true;
  return false;
}

type Side = 'her' | 'you';

/**
 * Cluster lines into bubbles by vertical proximity + horizontal edge
 * alignment (chat text is left-aligned inside BOTH left and right bubbles,
 * so a short second line shares its left edge with the rest of its bubble).
 * The sender is then assigned from the bubble's widest line: standard chat
 * layout anchors your bubbles to the right half, hers to the left.
 */
function clusterBubbles(lines: LineBox[], imgW: number): { sender: Side; text: string }[] {
  if (lines.length === 0) return [];
  const heights = lines.map((l) => l.height).sort((a, b) => a - b);
  const medH = heights[Math.floor(heights.length / 2)] || 16;

  const bubbles: LineBox[][] = [];
  for (const line of lines) {
    const prev = bubbles[bubbles.length - 1];
    let sameBubble = false;
    if (prev) {
      const prevBottom = Math.max(...prev.map((l) => l.y1));
      const gap = line.y0 - prevBottom;
      const prevX0 = Math.min(...prev.map((l) => l.x0));
      const prevX1 = Math.max(...prev.map((l) => l.x1));
      const leftAlign = Math.abs(line.x0 - prevX0) <= imgW * 0.12;
      const rightAlign = Math.abs(line.x1 - prevX1) <= imgW * 0.12;
      sameBubble = gap >= -medH * 0.5 && gap <= medH * 1.6 && (leftAlign || rightAlign);
    }
    if (sameBubble) prev!.push(line);
    else bubbles.push([line]);
  }

  return bubbles
    .map((ls) => {
      const widest = [...ls].sort((a, b) => b.x1 - b.x0 - (a.x1 - a.x0))[0];
      return {
        sender: (widest.centerX >= imgW / 2 ? 'you' : 'her') as Side,
        text: ls
          .map((l) => l.text)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim(),
      };
    })
    .filter((b) => b.text.length > 0);
}

/**
 * Merged multi-pass word set + image dimensions → detected bubbles.
 */
export function messagesFromWords(
  words: WordBox[],
  imgW: number,
  imgH: number,
  imageIndex: number,
  idPrefix = `img${imageIndex}`,
): DetectedMessage[] {
  const lines = groupLines(words).filter((l, idx) => !isNoiseLine(l, imgW, imgH, idx));
  return clusterBubbles(lines, imgW)
    .map((b, j) => ({
      id: `${idPrefix}-b${j}`,
      sender: b.sender,
      text: b.text,
      imageIndex,
    }));
}

/**
 * Pure single-page pipeline kept for compatibility: one tesseract page
 * result + image dimensions → detected bubbles.
 */
export function messagesFromPage(
  data: unknown,
  imgW: number,
  imgH: number,
  imageIndex: number,
  idPrefix = `img${imageIndex}`,
): DetectedMessage[] {
  return messagesFromWords(collectWords(data), imgW, imgH, imageIndex, idPrefix);
}

/**
 * Early-exit gate after the first (luminance) pass: if the merged word set
 * is already strong — enough words, both screen halves populated (so both
 * sides of the chat are being read), and high mean confidence — the extra
 * channel/inversion passes are skipped and the full 8-pass read remains the
 * fallback for anything weaker. Thresholds from the audit:
 * ≥ 12 words, ≥ 3 words centered in each half, mean confidence ≥ 60.
 *
 * A wide left bubble can push word centers across the midline, so "centerX
 * in the right half" alone can't prove the right-anchored side was actually
 * read (e.g. white text on a saturated bubble that vanishes under luminance
 * while her gray bubbles read fine). Right-side words must therefore also
 * reach the right margin (x1 ≥ 78% width) — right-anchored bubbles always
 * end there, while left bubbles stop at ~75% width even at their widest.
 */
function firstPassIsStrong(words: WordBox[], imgW: number): boolean {
  if (words.length < 12) return false;
  const mid = imgW / 2;
  const left = words.filter((w) => (w.x0 + w.x1) / 2 < mid).length;
  const right = words.filter((w) => (w.x0 + w.x1) / 2 >= mid && w.x1 >= imgW * 0.78).length;
  if (left < 3 || right < 3) return false;
  const meanConf = words.reduce((s, w) => s + w.confidence, 0) / words.length;
  return meanConf >= 60;
}

/**
 * The DOM-free core of the multi-pass read: derive the preprocessing passes,
 * OCR each through the injected `recognize` callback, union the word boxes,
 * and run the lines → bubbles → sender pipeline on the merged set. The
 * browser path feeds canvases to a tesseract worker; the Node test harness
 * feeds PNG buffers — both exercise exactly this code.
 */
export async function detectMessagesInPixels(
  img: PixelImage,
  imageIndex: number,
  idPrefix: string,
  recognize: (pass: OcrPass) => Promise<unknown>,
  onPass?: (passIndex: number, totalPasses: number) => void,
): Promise<DetectedMessage[]> {
  const passes = buildOcrPasses(img);
  const perPass: WordBox[][] = [];
  for (let i = 0; i < passes.length; i++) {
    onPass?.(i, passes.length);
    const data = await recognize(passes[i]);
    perPass.push(collectWords(data));
    if (i === 0 && firstPassIsStrong(mergeWordBoxes(perPass), img.width)) break;
  }
  return messagesFromWords(mergeWordBoxes(perPass), img.width, img.height, imageIndex, idPrefix);
}

/* ------------------------------ browser path ------------------------------ */

interface PreparedImage {
  pixels: PixelImage;
  width: number;
  height: number;
}

/**
 * Decode the image to raw RGBA pixels on a canvas. Oversized screenshots are
 * capped at 1600px wide — plenty for OCR and much faster on phone hardware.
 */
function decodeToPixels(blob: Blob): Promise<PreparedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 1600 / img.naturalWidth);
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Canvas unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h);
      resolve({ pixels: { data: frame.data, width: w, height: h }, width: w, height: h });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });
}

/** Paint a grayscale PixelImage onto a fresh canvas for worker.recognize. */
function pixelsToCanvas(p: PixelImage): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = p.width;
  canvas.height = p.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.putImageData(new ImageData(p.data, p.width, p.height), 0, 0);
  return canvas;
}

/**
 * Read chat screenshots (in user-chosen order) and extract ordered messages.
 * Each image is OCR'd under multiple preprocessing passes and the results
 * are merged before bubble detection. Throws if no readable text is found
 * in any image.
 */
export async function extractMessagesFromImages(
  images: Blob[],
  onProgress?: (p: OcrProgress) => void,
): Promise<DetectedMessage[]> {
  const total = images.length;
  let passIndex = 0;
  let totalPasses = 1;
  let fraction = 0; // recognize progress within the current pass
  let currentImage = 1;
  const report = (image: number) =>
    onProgress?.({
      image,
      total,
      // fold the multi-pass read into each image's slice of the bar
      percent: Math.round(
        ((image - 1 + Math.min(1, (passIndex + fraction) / totalPasses)) / total) * 100,
      ),
    });

  const worker = await loadWorker((f) => {
    fraction = f;
    report(currentImage);
  });

  const out: DetectedMessage[] = [];
  try {
    for (let i = 0; i < total; i++) {
      currentImage = i + 1;
      fraction = 0;
      passIndex = 0;
      report(currentImage);
      const prepared = await decodeToPixels(images[i]);

      // blocks output is off by default in tesseract.js v7 — request the
      // word-level hierarchy explicitly (needed for bounding boxes).
      const found = await detectMessagesInPixels(
        prepared.pixels,
        i,
        `img${i}-x${out.length}`,
        async (pass) => {
          fraction = 0;
          const { data } = await worker.recognize(pixelsToCanvas(pass.pixels), {}, { blocks: true });
          return data;
        },
        (idx, count) => {
          passIndex = idx;
          totalPasses = count;
          report(currentImage);
        },
      );
      found.forEach((m) => out.push(m));
    }
  } finally {
    await worker.terminate();
  }

  if (out.length === 0) {
    throw new Error('No readable chat text found — try a sharper screenshot.');
  }
  return out;
}
