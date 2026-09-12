import { AnimatePresence, motion } from 'framer-motion';
import { EASE_EXPO } from '@/lib/splitText';

/** Bottom-center mono toast (design.md §6) — slides up 24px + fades, 350ms. */
export default function Toast({ message }: { message: string | null }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[95] flex justify-center px-6">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.35, ease: EASE_EXPO }}
            className="mono-label rounded-md border border-amber bg-surface-2 px-5 py-3 text-[12px] text-cream shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
            role="status"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
