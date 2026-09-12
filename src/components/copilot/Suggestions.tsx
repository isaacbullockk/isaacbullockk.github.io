import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Copy, Heart, RefreshCw, Shuffle } from 'lucide-react';
import type { Reply, ReplyTone } from '@/lib/engine';
import { REPLY_TONE_COLORS, TONE_LABELS } from '@/lib/engine';
import { EASE_EXPO } from '@/lib/splitText';
import { cn } from '@/lib/utils';

export function favId(reply: Reply): string {
  return `copilot::${reply.text}`;
}

interface SuggestionsProps {
  replies: Reply[];
  stalled: boolean;
  badge: string;
  aiMode: boolean;
  regenerating: boolean;
  favs: string[];
  onToggleFav: (reply: Reply) => void;
  onCopy: (text: string) => void;
  onRegenerate: () => void;
}

/* ------------------------------ single card ------------------------------- */

function SuggestionCard({
  reply,
  index,
  isFav,
  onToggleFav,
  onCopy,
}: {
  reply: Reply;
  index: number;
  isFav: boolean;
  onToggleFav: () => void;
  onCopy: (text: string) => void;
}) {
  const [whyOpen, setWhyOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const color = REPLY_TONE_COLORS[reply.tone];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reply.text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = reply.text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    onCopy(reply.text);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.5, ease: EASE_EXPO, delay: index * 0.1 }}
      className="card-lift flex flex-col rounded-lg border border-hairline bg-surface p-6 shadow-[inset_0_1px_0_rgba(235,178,107,0.06)] [transform-style:preserve-3d]"
      style={{ borderTopColor: `${color}55` }}
    >
      {/* tone eyebrow */}
      <p className="mono-label text-[10.5px]" style={{ color }}>
        {TONE_LABELS[reply.tone]} — {reply.principle}
      </p>

      {/* reply payload */}
      <p className="mt-4 flex-1 font-display text-[19px] leading-[1.45] text-cream md:text-[20px]">
        {reply.text}
      </p>

      {/* why this works accordion */}
      <div className="mt-5 border-t border-hairline pt-4">
        <button
          type="button"
          onClick={() => setWhyOpen((o) => !o)}
          className="mono-label flex w-full items-center justify-between text-[10px] text-cream-dim transition-colors hover:text-cream"
          aria-expanded={whyOpen}
        >
          WHY THIS WORKS
          <motion.span animate={{ rotate: whyOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="h-3.5 w-3.5" />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {whyOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_EXPO }}
              className="overflow-hidden"
            >
              <p className="pt-3 text-[13px] leading-relaxed text-cream-dim">{reply.why}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* footer row */}
      <div className="mt-4 flex items-center gap-2">
        <span
          className="mono-label rounded border px-2.5 py-[5px] text-[10px]"
          style={{ color: '#B4683B', borderColor: 'rgba(180,104,59,0.4)' }}
        >
          {reply.principle}
        </span>
        <span className="flex-1" />
        <motion.button
          type="button"
          onClick={copy}
          data-cursor-label="COPY"
          animate={copied ? { scale: [1, 1.12, 1] } : {}}
          transition={{ duration: 0.16 }}
          className={cn(
            'mono-label inline-flex items-center gap-1.5 rounded border px-3 py-[6px] text-[10.5px] transition-colors duration-200',
            copied
              ? 'border-sage/60 text-sage'
              : 'border-hairline text-cream-dim hover:border-amber hover:text-cream',
          )}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'COPIED ✓' : 'COPY'}
        </motion.button>
        <button
          type="button"
          onClick={onToggleFav}
          data-cursor-label="SAVE"
          className="rounded border border-hairline p-[7px] transition-colors duration-200 hover:border-copper"
          aria-label={isFav ? 'Remove from favorites' : 'Save to favorites'}
          aria-pressed={isFav}
        >
          <Heart
            className={cn(
              'h-3.5 w-3.5 transition-colors duration-200',
              isFav ? 'fill-copper text-copper' : 'text-cream-dim',
            )}
          />
        </button>
      </div>
    </motion.article>
  );
}

/* ------------------------------- the section ------------------------------ */

export default function Suggestions({
  replies,
  stalled,
  badge,
  aiMode,
  regenerating,
  favs,
  onToggleFav,
  onCopy,
  onRegenerate,
}: SuggestionsProps) {
  const tones = replies.map((r) => r.tone);
  const [active, setActive] = useState<ReplyTone>(tones[0] ?? 'playful');
  const activeTone = tones.includes(active) ? active : tones[0];

  // A key that changes whenever a fresh set of replies lands → restaggers cards.
  const setKey = replies.map((r) => r.text).join('|');

  return (
    <section className="mt-8">
      {/* header row */}
      <div className="flex flex-wrap items-center gap-3">
        <p className="mono-label text-[12px] text-amber">SUGGESTED REPLIES</p>
        <span className="mono-label rounded border border-hairline px-2.5 py-[4px] text-[9.5px] text-cream-faint">
          {badge}
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={onRegenerate}
          disabled={regenerating}
          className="mono-label inline-flex items-center gap-2 rounded-md border border-hairline px-4 py-2.5 text-[10.5px] text-cream transition-all duration-300 hover:border-amber hover:bg-surface-2 active:scale-[0.97] disabled:opacity-40"
        >
          {aiMode ? (
            <RefreshCw className={cn('h-3.5 w-3.5', regenerating && 'animate-spin')} />
          ) : (
            <Shuffle className="h-3.5 w-3.5" />
          )}
          {aiMode ? 'REGENERATE' : 'SHUFFLE VARIANTS'}
        </button>
      </div>

      {/* stalled notice */}
      {stalled && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mono-label mt-4 border-l-2 border-wine pl-3 text-[10.5px] leading-relaxed text-wine"
        >
          SHE’S COOLING. ONE SWING, THEN WALK AWAY TALL.
        </motion.p>
      )}

      {/* tone tabs */}
      <div className="mt-5 inline-flex flex-wrap gap-1 rounded-full bg-surface-2 p-1">
        {replies.map((r) => {
          const color = REPLY_TONE_COLORS[r.tone];
          const isActive = r.tone === activeTone;
          return (
            <button
              key={r.tone}
              type="button"
              onClick={() => setActive(r.tone)}
              className="mono-label relative rounded-full px-4 py-2 text-[11px] transition-colors duration-300"
              style={{ color: isActive ? color : '#A89C87' }}
            >
              {isActive && (
                <motion.span
                  layoutId="tone-tab-pill"
                  className="absolute inset-0 rounded-full"
                  style={{
                    backgroundColor: `${color}2E`, // ~18% fill
                    border: `1px solid ${color}`,
                  }}
                  transition={{ duration: 0.3, ease: EASE_EXPO }}
                />
              )}
              <span className="relative">{TONE_LABELS[r.tone]}</span>
            </button>
          );
        })}
      </div>

      {/* cards — all side-by-side on lg; single active card (tabbed) below lg */}
      <div key={setKey} className="mt-6" style={{ perspective: '1200px' }}>
        <div className="hidden gap-5 lg:grid" style={{ gridTemplateColumns: `repeat(${replies.length}, minmax(0,1fr))` }}>
          {replies.map((r, i) => (
            <div
              key={r.tone}
              className={cn(
                'transition-opacity duration-300',
                r.tone === activeTone ? 'opacity-100' : 'opacity-45',
              )}
            >
              <SuggestionCard
                reply={r}
                index={i}
                isFav={favs.includes(favId(r))}
                onToggleFav={() => onToggleFav(r)}
                onCopy={onCopy}
              />
            </div>
          ))}
        </div>

        <div className="lg:hidden">
          <AnimatePresence mode="wait" initial={false}>
            {replies
              .filter((r) => r.tone === activeTone)
              .map((r) => (
                <motion.div
                  key={`${setKey}-${r.tone}`}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.3, ease: EASE_EXPO }}
                >
                  <SuggestionCard
                    reply={r}
                    index={0}
                    isFav={favs.includes(favId(r))}
                    onToggleFav={() => onToggleFav(r)}
                    onCopy={onCopy}
                  />
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
