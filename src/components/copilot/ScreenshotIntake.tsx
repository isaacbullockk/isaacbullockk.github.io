import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, ImagePlus, ScanText, X } from 'lucide-react';
import type { ChatMessage } from '@/lib/engine';
import type { DetectedMessage, OcrProgress } from '@/lib/ocr';
import { EASE_EXPO } from '@/lib/splitText';
import { cn } from '@/lib/utils';
import MessageReview from '@/components/copilot/MessageReview';

interface Shot {
  id: string;
  file: File;
  url: string;
}

interface ScreenshotIntakeProps {
  onAnalyze: (messages: ChatMessage[]) => void;
}

/**
 * Screenshot intake tab (design §8 mobile workflow). Multiple images, ordered
 * thumbnails with reorder/remove, lazy client-side OCR with a mono progress
 * readout, then an editable review step before anything reaches the engine.
 */
export default function ScreenshotIntake({ onAnalyze }: ScreenshotIntakeProps) {
  const [shots, setShots] = useState<Shot[]>([]);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [messages, setMessages] = useState<DetectedMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shotsRef = useRef<Shot[]>([]);
  shotsRef.current = shots;

  // release object URLs on unmount
  useEffect(
    () => () => {
      shotsRef.current.forEach((s) => URL.revokeObjectURL(s.url));
    },
    [],
  );

  const addFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next: Shot[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      next.push({
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        url: URL.createObjectURL(file),
      });
    }
    if (next.length > 0) {
      setShots((s) => [...s, ...next]);
      setMessages(null);
      setError(null);
    }
  }, []);

  const move = useCallback((id: string, dir: -1 | 1) => {
    setShots((s) => {
      const idx = s.findIndex((x) => x.id === id);
      const to = idx + dir;
      if (idx < 0 || to < 0 || to >= s.length) return s;
      const next = [...s];
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });
    setMessages(null);
  }, []);

  const remove = useCallback((id: string) => {
    setShots((s) => {
      const target = s.find((x) => x.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return s.filter((x) => x.id !== id);
    });
    setMessages(null);
  }, []);

  const read = useCallback(async () => {
    if (shots.length === 0 || reading) return;
    setReading(true);
    setError(null);
    setProgress({ image: 1, total: shots.length, percent: 0 });
    try {
      // lazy-loaded on first use — keeps tesseract.js out of the main bundle
      const { extractMessagesFromImages } = await import('@/lib/ocr');
      const found = await extractMessagesFromImages(
        shots.map((s) => s.file),
        setProgress,
      );
      setMessages(found);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not read these screenshots — try sharper images.',
      );
      setMessages(null);
    } finally {
      setReading(false);
      setProgress(null);
    }
  }, [shots, reading]);

  const confirm = useCallback(
    (msgs: ChatMessage[]) => {
      onAnalyze(msgs);
    },
    [onAnalyze],
  );

  return (
    <div className="mt-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = '';
        }}
        aria-label="Add chat screenshots"
      />

      {messages === null ? (
        <>
          {/* drop / pick area */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={reading}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-hairline bg-surface-2 px-4 py-10 text-center transition-all duration-300 hover:border-amber/60 hover:bg-surface-2/70 disabled:opacity-50"
          >
            <ImagePlus className="h-6 w-6 text-amber" />
            <span className="mono-label text-[11px] text-cream-dim">
              ADD SCREENSHOTS
            </span>
            <span className="mono-label text-[9.5px] text-cream-faint">
              CHAT SCREENSHOTS, IN ORDER — CAMERA OR LIBRARY
            </span>
          </button>

          {/* thumbnails */}
          <AnimatePresence initial={false}>
            {shots.length > 0 && (
              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 space-y-2"
              >
                <AnimatePresence initial={false}>
                  {shots.map((s, i) => (
                    <motion.li
                      key={s.id}
                      layout="position"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.25, ease: EASE_EXPO }}
                      className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-2 p-2"
                    >
                      <span className="mono-label w-6 shrink-0 text-center text-[10px] text-cream-faint">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <img
                        src={s.url}
                        alt={`Screenshot ${i + 1}`}
                        className="h-14 w-14 shrink-0 rounded border border-hairline object-cover"
                      />
                      <span className="mono-label min-w-0 flex-1 truncate text-[10px] text-cream-dim">
                        {s.file.name || `SCREENSHOT ${i + 1}`}
                      </span>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => move(s.id, -1)}
                          disabled={i === 0 || reading}
                          className="rounded p-1.5 text-cream-faint transition-colors hover:text-cream disabled:opacity-30"
                          aria-label={`Move screenshot ${i + 1} up`}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(s.id, 1)}
                          disabled={i === shots.length - 1 || reading}
                          className="rounded p-1.5 text-cream-faint transition-colors hover:text-cream disabled:opacity-30"
                          aria-label={`Move screenshot ${i + 1} down`}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(s.id)}
                          disabled={reading}
                          className="rounded p-1.5 text-cream-faint transition-colors hover:text-wine disabled:opacity-30"
                          aria-label={`Remove screenshot ${i + 1}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            )}
          </AnimatePresence>

          {/* read action + progress */}
          <button
            type="button"
            onClick={() => void read()}
            disabled={shots.length === 0 || reading}
            className={cn(
              'mono-label mt-4 flex w-full items-center justify-center gap-2 rounded-md border px-6 py-4 text-[12px] transition-all duration-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40',
              reading
                ? 'border-amber/50 text-amber'
                : 'border-hairline text-cream hover:border-amber hover:bg-surface-2',
            )}
          >
            <ScanText className="h-4 w-4" />
            {reading ? 'READING…' : `READ ${shots.length > 0 ? shots.length : ''} SCREENSHOT${shots.length === 1 ? '' : 'S'}`}
          </button>

          <AnimatePresence>
            {reading && progress && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mono-label mt-3 text-center text-[10.5px] text-amber"
                role="status"
              >
                READING IMAGE {progress.image} OF {progress.total} — {progress.percent}%
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mono-label mt-3 rounded-md border border-wine/50 px-4 py-3 text-[10.5px] leading-relaxed text-wine"
                role="alert"
              >
                {error.toUpperCase()}
              </motion.p>
            )}
          </AnimatePresence>

          {/* privacy note */}
          <p className="mono-label mt-4 text-[9.5px] leading-relaxed text-cream-faint">
            READ ON YOUR DEVICE. SCREENSHOTS NEVER LEAVE THIS BROWSER.
          </p>
        </>
      ) : (
        <MessageReview
          messages={messages}
          onChange={setMessages}
          onReRun={() => setMessages(null)}
          onAnalyze={confirm}
        />
      )}
    </div>
  );
}
