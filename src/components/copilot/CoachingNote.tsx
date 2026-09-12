import { motion } from 'framer-motion';
import { EASE_EXPO } from '@/lib/splitText';

/**
 * Section 4d — coaching note strip (copilot.md §4d). Left 3px amber border
 * draws top→bottom; the note fades in word-by-word.
 */
export default function CoachingNote({ note, source }: { note: string; source: string }) {
  const words = note.split(' ');

  return (
    <div className="relative overflow-hidden rounded-r-lg bg-surface py-5 pl-6 pr-6">
      {/* 3px amber border, draws top → bottom */}
      <motion.span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px] origin-top bg-amber"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.4, ease: EASE_EXPO }}
      />
      <p className="font-display text-[18px] italic leading-[1.5] text-cream md:text-[20px]">
        {words.map((w, i) => (
          <motion.span
            key={`${w}-${i}`}
            className="inline-block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.2 + i * 0.025 }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        ))}
      </p>
      <motion.p
        className="mono-label mt-3 text-[10.5px] text-amber"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 + words.length * 0.025 }}
      >
        {source}
      </motion.p>
    </div>
  );
}
