import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpToLine, RotateCcw, Trash2 } from 'lucide-react';
import type { ChatMessage } from '@/lib/engine';
import type { DetectedMessage } from '@/lib/ocr';
import { EASE_EXPO } from '@/lib/splitText';
import { cn } from '@/lib/utils';

interface MessageReviewProps {
  messages: DetectedMessage[];
  onChange: (messages: DetectedMessage[]) => void;
  onReRun: () => void;
  onAnalyze: (messages: ChatMessage[]) => void;
}

/**
 * Editable review step after OCR (design §6 surface cards). Every detected
 * bubble is a row: inline-editable text, a HER/YOU sender toggle, merge-with-
 * previous and delete. Nothing reaches the engine until ANALYZE is pressed.
 */
export default function MessageReview({
  messages,
  onChange,
  onReRun,
  onAnalyze,
}: MessageReviewProps) {
  const update = (id: string, patch: Partial<DetectedMessage>) =>
    onChange(messages.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const remove = (id: string) => onChange(messages.filter((m) => m.id !== id));

  const mergeUp = (id: string) => {
    const idx = messages.findIndex((m) => m.id === id);
    if (idx <= 0) return;
    const next = [...messages];
    next[idx - 1] = {
      ...next[idx - 1],
      text: `${next[idx - 1].text} ${next[idx].text}`.replace(/\s+/g, ' ').trim(),
    };
    next.splice(idx, 1);
    onChange(next);
  };

  const usable = messages.filter((m) => m.text.trim().length > 0);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="mono-label text-[10.5px] text-cream-faint">
          REVIEW THE READ ({messages.length})
        </p>
        <button
          type="button"
          onClick={onReRun}
          className="mono-label inline-flex items-center gap-1.5 rounded border border-hairline px-3 py-1.5 text-[10px] text-cream-dim transition-all duration-300 hover:border-amber hover:text-cream active:scale-[0.96]"
        >
          <RotateCcw className="h-3 w-3" />
          RE-RUN
        </button>
      </div>
      <p className="mono-label mt-2 text-[9.5px] leading-relaxed text-cream-faint">
        OCR MISSES THINGS — FIX TEXT AND SENDERS BEFORE ANALYZING. RIGHT SIDE = YOU, LEFT = HER.
      </p>

      <ul className="mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.li
              key={m.id}
              layout="position"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25, ease: EASE_EXPO }}
              className={cn(
                'rounded-lg border border-hairline bg-surface-2 p-3',
                m.sender === 'you' && 'border-l-2 border-l-amber/50',
                m.sender === 'her' && 'border-l-2 border-l-copper/50',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                {/* sender toggle */}
                <div className="relative flex rounded-full border border-hairline p-[2px]">
                  {(['her', 'you'] as const).map((s) => {
                    const active = m.sender === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => update(m.id, { sender: s })}
                        className={cn(
                          'mono-label relative rounded-full px-3 py-1 text-[9.5px] transition-colors duration-200',
                          active
                            ? s === 'you'
                              ? 'text-amber'
                              : 'text-copper'
                            : 'text-cream-faint hover:text-cream-dim',
                        )}
                        aria-pressed={active}
                      >
                        {active && (
                          <motion.span
                            layoutId={`sender-pill-${m.id}`}
                            className={cn(
                              'absolute inset-0 rounded-full border',
                              s === 'you'
                                ? 'border-amber/60 bg-amber/[0.12]'
                                : 'border-copper/60 bg-copper/[0.12]',
                            )}
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          />
                        )}
                        <span className="relative">{s.toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>

                {/* row actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => mergeUp(m.id)}
                    disabled={i === 0}
                    className="mono-label inline-flex items-center gap-1 rounded px-2 py-1 text-[9px] text-cream-faint transition-colors duration-200 hover:text-cream disabled:cursor-not-allowed disabled:opacity-30"
                    title="Merge with previous bubble"
                    aria-label="Merge with previous bubble"
                  >
                    <ArrowUpToLine className="h-3 w-3" />
                    MERGE ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    className="rounded p-1.5 text-cream-faint transition-colors duration-200 hover:text-wine"
                    title="Delete row"
                    aria-label="Delete row"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                value={m.text}
                onChange={(e) => update(m.id, { text: e.target.value })}
                rows={2}
                spellCheck={false}
                className="mt-2 w-full resize-y rounded-md border border-hairline bg-surface px-3 py-2 font-mono text-[12.5px] leading-relaxed text-cream focus:border-amber/60 focus:outline-none focus:ring-[3px] focus:ring-glow"
                aria-label={`Message ${i + 1} text`}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {messages.length === 0 && (
        <p className="mono-label mt-4 rounded-md border border-hairline px-4 py-6 text-center text-[10.5px] text-cream-faint">
          ALL ROWS DELETED — RE-RUN TO READ THE SCREENSHOTS AGAIN.
        </p>
      )}

      <button
        type="button"
        onClick={() => onAnalyze(usable.map(({ sender, text }) => ({ sender, text: text.trim() })))}
        disabled={usable.length === 0}
        className="btn-sheen mono-label mt-5 w-full rounded-md bg-amber px-7 py-4 text-[13px] font-semibold text-ink transition-all duration-300 hover:bg-amber-bright active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
      >
        ANALYZE {usable.length > 0 ? `${usable.length} MESSAGES` : ''} →
      </button>
    </div>
  );
}
