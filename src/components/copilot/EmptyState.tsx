import { motion } from 'framer-motion';
import { EASE_EXPO } from '@/lib/splitText';

const WORDS = ['Paste.', 'Read.', 'Move.'];

/** Section 3 — empty state for the results column (copilot.md §3). */
export default function EmptyState() {
  return (
    <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-xl border border-hairline bg-surface/40">
      {/* Faint meter arc outline behind, 6% opacity */}
      <svg
        aria-hidden
        viewBox="0 0 240 160"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[510px] -translate-x-1/2 -translate-y-1/2 text-cream opacity-[0.06]"
      >
        <path
          d="M 21.5 147.4 A 100 100 0 1 1 218.5 147.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>

      <motion.div
        className="relative px-8 py-16 text-center"
        animate={{ y: [0, -6, 0, 6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <p className="font-display text-[34px] font-normal italic leading-tight text-cream-faint md:text-[44px]">
          {WORDS.map((w, i) => (
            <motion.span
              key={w}
              className="inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_EXPO, delay: 0.15 + i * 0.06 }}
            >
              {w}
              {i < WORDS.length - 1 ? ' ' : ''}
            </motion.span>
          ))}
        </p>

        {/* Hairline diamond ornament */}
        <motion.div
          className="mx-auto mt-8 flex items-center justify-center gap-3"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE_EXPO, delay: 0.45 }}
        >
          <span className="h-px w-16 bg-hairline" />
          <span className="block h-1.5 w-1.5 rotate-45 border border-amber/50" />
          <span className="h-px w-16 bg-hairline" />
        </motion.div>

        <motion.p
          className="mono-label mt-8 text-[11px] text-cream-faint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          OR HIT “LOAD SAMPLE” TO SEE A FULL READ.
        </motion.p>
      </motion.div>
    </div>
  );
}
