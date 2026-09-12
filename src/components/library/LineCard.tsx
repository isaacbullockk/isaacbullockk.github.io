import { memo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clipboard, Heart } from 'lucide-react';
import type { LibraryLine } from '@/lib/lines';
import { CONTEXT_CHIP_LABELS } from '@/lib/lines';
import type { ChatContext } from '@/lib/engine';
import { STAGE_LABELS, TONE_COLORS } from '@/lib/engine';
import { EASE_EXPO } from '@/lib/splitText';
import { cn } from '@/lib/utils';

interface LineCardProps {
  line: LibraryLine;
  index: number;
  isFav: boolean;
  onToggleFav: (id: string) => void;
  onCopy: (line: LibraryLine) => void;
}

/**
 * Library §3 — Line card. Context + stage chips, Fraunces line text with
 * amber template slots, principle chip, COPY → COPIED ✓ swap, favorite heart.
 */
function LineCard({ line, index, isFav, onToggleFav, onCopy }: LineCardProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const handleCopy = () => {
    onCopy(line);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1400);
  };

  // Render [template slots] in amber brackets (library.md §3).
  const parts = line.text.split(/(\[[^\]]+\])/g);

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.06, ease: EASE_EXPO }}
      className="card-lift flex flex-col rounded-lg border border-hairline bg-surface p-6 shadow-[inset_0_1px_0_rgba(235,178,107,0.06)]"
    >
      {/* Top row: context chips + stage chip + favorite */}
      <div className="flex items-center gap-2">
        {line.contexts.slice(0, 2).map((ctx: ChatContext) => (
          <span
            key={ctx}
            className="mono-label rounded border border-hairline px-2 py-1 text-[10.5px] text-cream-dim"
          >
            {CONTEXT_CHIP_LABELS[ctx]}
          </span>
        ))}
        <span className="mono-label flex items-center gap-1.5 rounded border border-hairline/60 px-2 py-1 text-[10.5px] text-cream-faint">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: TONE_COLORS[line.tone] }}
            title={`${line.tone} tone`}
            aria-hidden
          />
          {STAGE_LABELS[line.stage]}
        </span>
        <motion.button
          whileTap={{ scale: 1.25 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          onClick={() => onToggleFav(line.id)}
          aria-pressed={isFav}
          aria-label={isFav ? 'Remove from favorites' : 'Save to favorites'}
          className="ml-auto flex h-8 w-8 items-center justify-center text-cream-faint transition-colors duration-200 hover:text-copper"
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-all duration-200',
              isFav ? 'fill-copper text-copper' : 'fill-transparent',
            )}
          />
        </motion.button>
      </div>

      {/* The line */}
      <p className="mt-5 font-display text-[19px] leading-[1.45] text-cream">
        {parts.map((part, i) =>
          part.startsWith('[') ? (
            <span key={i} className="text-amber">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </p>

      {/* Divider + bottom row */}
      <div className="mt-auto pt-5">
        <div className="border-t border-hairline pt-4">
          <div className="flex items-center justify-between gap-3">
            <span
              className="mono-label rounded border border-copper/40 px-2 py-1 text-[10.5px] text-copper"
              title={line.citation ? `${line.why} (${line.citation})` : line.why}
            >
              {line.principle}
            </span>
            <motion.button
              onClick={handleCopy}
              animate={copied ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.16 }}
              className={cn(
                'mono-label flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-[11px] transition-colors duration-200 active:scale-[0.97]',
                copied
                  ? 'border-sage/60 text-sage'
                  : 'border-hairline text-cream-dim hover:border-amber/50 hover:text-cream',
              )}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Clipboard className="h-3.5 w-3.5" aria-hidden />
              )}
              {copied ? 'COPIED ✓' : 'COPY'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default memo(LineCard);
