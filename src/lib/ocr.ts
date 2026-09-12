/**
 * Client-side screenshot → chat-thread extraction.
 *
 * tesseract.js is loaded lazily (dynamic import) the first time the user reads
 * a screenshot, and the worker / WASM core / language data are vendored under
 * `public/tesseract/` so OCR runs fully offline and nothing leaves the device.
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

/** Flatten tesseract's block hierarchy into word boxes, then into line boxes. */
function collectLines(data: unknown): LineBox[] {
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

  const usable = words.filter((w) => w.confidence >= 25 && REAL_WORD.test(w.text));
  if (usable.length === 0) return [];

  // Group words into visual lines: sort by vertical center, then cluster.
  const heights = usable.map((w) => w.y1 - w.y0).sort((a, b) => a - b);
  const medH = heights[Math.floor(heights.length / 2)] || 12;
  const sorted = [...usable].sort((a, b) => (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2);

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
 * Pure pipeline: one tesseract page result + image dimensions → detected
 * bubbles (exported for testing; `extractMessagesFromImages` is the UI path).
 */
export function messagesFromPage(
  data: unknown,
  imgW: number,
  imgH: number,
  imageIndex: number,
  idPrefix = `img${imageIndex}`,
): DetectedMessage[] {
  const lines = collectLines(data).filter((l, idx) => !isNoiseLine(l, imgW, imgH, idx));
  return clusterBubbles(lines, imgW)
    .map((b, j) => ({
      id: `${idPrefix}-b${j}`,
      sender: b.sender,
      text: b.text,
      imageIndex,
    }));
}

/**
 * Read chat screenshots (in user-chosen order) and extract ordered messages.
 * Throws if no readable text is found in any image.
 */
export async function extractMessagesFromImages(
  images: Blob[],
  onProgress?: (p: OcrProgress) => void,
): Promise<DetectedMessage[]> {
  const total = images.length;
  let fraction = 0;
  let currentImage = 1;
  const report = (image: number) =>
    onProgress?.({ image, total, percent: Math.round(((image - 1 + fraction) / total) * 100) });

  const worker = await loadWorker((f) => {
    fraction = f;
    report(currentImage);
  });

  const out: DetectedMessage[] = [];
  try {
    for (let i = 0; i < total; i++) {
      currentImage = i + 1;
      fraction = 0;
      report(currentImage);
      // Chat screenshots mix light text on colored bubbles with dark text on
      // light bubbles; tesseract's global binarization loses one polarity on
      // color input. A luminance grayscale pass recovers both sides.
      const prepared = await toGrayscaleCanvas(images[i]);

      // blocks output is off by default in tesseract.js v7 — request the
      // word-level hierarchy explicitly (needed for bounding boxes).
      const { data } = await worker.recognize(prepared.canvas, {}, { blocks: true });
      const dims = { width: prepared.width, height: prepared.height };
      messagesFromPage(data, dims.width, dims.height, i, `img${i}-x${out.length}`).forEach((m) =>
        out.push(m),
      );
    }
  } finally {
    await worker.terminate();
  }

  if (out.length === 0) {
    throw new Error('No readable chat text found — try a sharper screenshot.');
  }
  return out;
}

interface PreparedImage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/**
 * Decode the image and flatten it to luminance grayscale on a canvas.
 * Oversized screenshots are capped at 1600px wide — plenty for OCR and much
 * faster on phone hardware.
 */
function toGrayscaleCanvas(blob: Blob): Promise<PreparedImage> {
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
      const px = frame.data;
      for (let i = 0; i < px.length; i += 4) {
        const lum = Math.round(px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114);
        px[i] = lum;
        px[i + 1] = lum;
        px[i + 2] = lum;
        px[i + 3] = 255;
      }
      ctx.putImageData(frame, 0, 0);
      resolve({ canvas, width: w, height: h });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });
}
