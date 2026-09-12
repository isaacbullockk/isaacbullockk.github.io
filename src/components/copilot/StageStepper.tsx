import { motion } from 'framer-motion';
import type { ConversationStage } from '@/lib/engine';
import { STAGE_DESCRIPTIONS, STAGE_LABELS, STAGE_ORDER } from '@/lib/engine';
import { EASE_EXPO } from '@/lib/splitText';
import { cn } from '@/lib/utils';

/**
 * Section 4a — five-node horizontal stepper (copilot.md §4a). Track draws
 * left→right, nodes pop in sequence, the current node pulses a gentle halo.
 */
export default function StageStepper({ stage }: { stage: ConversationStage }) {
  const currentIdx = STAGE_ORDER.indexOf(stage);

  return (
    <div className="overflow-x-auto pb-1">
      <div className="min-w-[560px]">
        <div className="relative">
          {/* hairline track */}
          <motion.div
            className="absolute left-0 right-0 top-[7px] h-px origin-left bg-hairline"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, ease: EASE_EXPO }}
          />
          <div className="relative grid grid-cols-5">
            {STAGE_ORDER.map((s, i) => {
              const isCurrent = i === currentIdx;
              const isDone = i < currentIdx;
              return (
                <div key={s} className="flex flex-col items-center">
                  <motion.div
                    className="relative flex h-[15px] w-[15px] items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.35 + i * 0.1,
                      ease: [0.34, 1.56, 0.64, 1], // back.out
                    }}
                  >
                    {isCurrent && (
                      <motion.span
                        aria-hidden
                        className="absolute inline-flex h-full w-full rounded-full bg-amber/40"
                        animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                      />
                    )}
                    <span
                      className={cn(
                        'relative block h-[9px] w-[9px] rounded-full',
                        isCurrent && 'bg-amber',
                        isDone && 'bg-copper',
                        !isCurrent && !isDone && 'bg-surface-2 ring-1 ring-hairline',
                      )}
                    />
                  </motion.div>
                  <motion.p
                    className={cn(
                      'mono-label mt-3 text-center text-[10px]',
                      isCurrent ? 'text-amber' : isDone ? 'text-copper' : 'text-cream-faint',
                    )}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                  >
                    {STAGE_LABELS[s]}
                  </motion.p>
                </div>
              );
            })}
          </div>
        </div>

        {/* current stage definition */}
        <motion.p
          key={stage}
          className="mt-4 text-center text-[13px] leading-relaxed text-cream-dim"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_EXPO, delay: 0.9 }}
        >
          {STAGE_DESCRIPTIONS[stage]}
        </motion.p>
      </div>
    </div>
  );
}
