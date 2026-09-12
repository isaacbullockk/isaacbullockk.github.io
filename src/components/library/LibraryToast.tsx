import { AnimatePresence, motion } from 'framer-motion';
import { EASE_EXPO } from '@/lib/splitText';

/**
 * Shared toast (design.md §6): bottom-center, surface-2 + 1px amber border,
 * mono 12px, slides up 24px + fades, 350ms, auto-dismiss handled by parent.
 */
export default function LibraryToast({ message }: { message: string | null }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[70] flex justify-center px-6">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            role="status"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.35, ease: EASE_EXPO }}
            className="mono-label rounded-md border border-amber/60 bg-surface-2 px-5 py-3 text-[12px] text-cream"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
