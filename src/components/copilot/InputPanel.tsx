import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, ChevronDown, Trash2 } from 'lucide-react';
import type { ChatContext, SavedConvo } from '@/lib/engine';
import { CONTEXT_CHIPS, STAGE_LABELS } from '@/lib/engine';
import { EASE_EXPO } from '@/lib/splitText';
import { cn } from '@/lib/utils';

interface InputPanelProps {
  context: ChatContext;
  onContext: (c: ChatContext) => void;
  herName: string;
  onHerName: (v: string) => void;
  raw: string;
  onRaw: (v: string) => void;
  analyzing: boolean;
  canSave: boolean;
  onAnalyze: () => void;
  onLoadSample: () => void;
  onSave: () => void;
  saved: SavedConvo[];
  onLoadConvo: (c: SavedConvo) => void;
  onDeleteConvo: (id: string) => void;
}

/** Three-dot pulse for the READING… state (300ms cycle). */
function Dots() {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-[3px] w-[3px] rounded-full bg-ink"
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

/** Section 2 — input panel: context chips, name field, textarea, actions, saved threads. */
export default function InputPanel(props: InputPanelProps) {
  const {
    context,
    onContext,
    herName,
    onHerName,
    raw,
    onRaw,
    analyzing,
    canSave,
    onAnalyze,
    onLoadSample,
    onSave,
    saved,
    onLoadConvo,
    onDeleteConvo,
  } = props;
  const [savedOpen, setSavedOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_EXPO }}
    >
      <div className="rounded-xl border border-hairline bg-surface p-6 shadow-[inset_0_1px_0_rgba(235,178,107,0.06)]">
        {/* Context selector */}
        <p className="mono-label text-[10.5px] text-cream-faint">CONTEXT</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CONTEXT_CHIPS.map((c) => {
            const active = context === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onContext(c.id)}
                className={cn(
                  'mono-label rounded border px-3 py-1.5 text-[11px] transition-all duration-150 active:scale-[0.96]',
                  active
                    ? 'border-amber bg-amber/[0.12] text-amber'
                    : 'border-hairline text-cream-dim hover:border-cream-faint hover:text-cream',
                )}
                aria-pressed={active}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Her name */}
        <label className="mono-label mt-6 block text-[10.5px] text-cream-faint" htmlFor="wm-her-name">
          HER NAME (OPTIONAL)
        </label>
        <input
          id="wm-her-name"
          type="text"
          value={herName}
          onChange={(e) => onHerName(e.target.value)}
          placeholder="For name-specific suggestions"
          autoComplete="off"
          className="mt-2 w-full rounded-md border border-hairline bg-surface-2 px-4 py-3 text-[14px] text-cream placeholder:text-cream-faint focus:border-amber/60 focus:outline-none focus:ring-[3px] focus:ring-glow"
        />

        {/* Textarea */}
        <label className="mono-label mt-6 block text-[10.5px] text-cream-faint" htmlFor="wm-thread">
          PASTE THE CONVERSATION
        </label>
        <textarea
          id="wm-thread"
          value={raw}
          onChange={(e) => onRaw(e.target.value)}
          placeholder="Paste the thread here — her messages and yours, in order…"
          spellCheck={false}
          className="mt-2 min-h-[260px] w-full resize-y rounded-md border border-hairline bg-surface-2 px-4 py-3 font-mono text-[13px] leading-relaxed text-cream placeholder:font-sans placeholder:text-cream-faint focus:border-amber/60 focus:outline-none focus:ring-[3px] focus:ring-glow"
        />
        <p className="mono-label mt-2 text-[9.5px] leading-relaxed text-cream-faint">
          TIP: PREFIX LINES WITH “HER:” AND “ME:” — OR JUST PASTE, WE’LL FIGURE IT OUT.
        </p>

        {/* Buttons */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onAnalyze}
            disabled={analyzing || !raw.trim()}
            className="btn-sheen mono-label flex-1 rounded-md bg-amber px-7 py-4 text-[13px] font-semibold text-ink transition-all duration-300 hover:bg-amber-bright active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:min-w-[190px]"
          >
            {analyzing ? (
              <span className="inline-flex items-center gap-2">
                READING <Dots />
              </span>
            ) : (
              'ANALYZE →'
            )}
          </button>
          <button
            type="button"
            onClick={onLoadSample}
            className="mono-label rounded-md border border-hairline px-6 py-4 text-[12px] text-cream transition-all duration-300 hover:border-amber hover:bg-surface-2 active:scale-[0.97]"
          >
            LOAD SAMPLE
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            data-cursor-label="SAVE"
            className="mono-label inline-flex items-center justify-center gap-2 rounded-md border border-hairline px-5 py-4 text-[12px] text-cream transition-all duration-300 hover:border-amber hover:bg-surface-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Save this thread"
            title="Save this thread"
          >
            <Bookmark className="h-4 w-4" />
            <span className="sm:hidden lg:inline">SAVE</span>
          </button>
        </div>
      </div>

      {/* Saved threads accordion */}
      <div className="mt-4 rounded-xl border border-hairline bg-surface">
        <button
          type="button"
          onClick={() => setSavedOpen((o) => !o)}
          className="flex w-full items-center justify-between px-6 py-4"
          aria-expanded={savedOpen}
        >
          <span className="mono-label text-[11px] text-cream-dim">
            SAVED THREADS ({saved.length})
          </span>
          <motion.span animate={{ rotate: savedOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="h-4 w-4 text-cream-faint" />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {savedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_EXPO }}
              className="overflow-hidden"
            >
              <div className="border-t border-hairline px-3 py-2">
                {saved.length === 0 ? (
                  <p className="mono-label px-3 py-4 text-[10.5px] text-cream-faint">
                    NOTHING SAVED YET — ANALYZE A THREAD, THEN HIT SAVE.
                  </p>
                ) : (
                  <ul>
                    <AnimatePresence initial={false}>
                      {saved.map((c, i) => (
                        <motion.li
                          key={c.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -12 }}
                          transition={{ duration: 0.25, delay: i * 0.05 }}
                          className="group flex items-center gap-3 rounded-md px-3 py-3 transition-colors hover:bg-surface-2"
                        >
                          <button
                            type="button"
                            onClick={() => onLoadConvo(c)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            data-cursor-label="OPEN"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-medium text-cream">
                                {c.name || 'Unknown'}
                                <span className="mono-label ml-2 text-[9.5px] text-cream-faint">
                                  {c.context.toUpperCase()} · {formatDate(c.savedAt).toUpperCase()}
                                </span>
                              </span>
                            </span>
                            <span className="mono-label shrink-0 rounded border border-copper/40 px-2 py-[3px] text-[9px] text-copper">
                              {STAGE_LABELS[c.stage]} · {c.interest}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteConvo(c.id)}
                            className="shrink-0 rounded p-1.5 text-cream-faint transition-colors hover:text-wine"
                            aria-label="Delete saved thread"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
