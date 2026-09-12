import { motion } from 'framer-motion';
import { EASE_EXPO } from '@/lib/splitText';

const FORMULA_TERMS = ['SPECIFIC OBSERVATION', 'PLAYFUL TENSION', 'EASY REPLY HOOK'];

/**
 * Library §4 — "Build Your Own" editorial strip. Full-bleed surface band;
 * wipes in with clip-path from the left, formula terms highlight sequentially.
 */
export default function BuildYourOwn() {
  return (
    <motion.section
      initial={{ clipPath: 'inset(0 100% 0 0)' }}
      whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.8, ease: EASE_EXPO }}
      className="border-y border-hairline bg-surface"
    >
      <div className="mx-auto grid max-w-[1200px] gap-12 px-6 py-20 md:grid-cols-2 md:items-center lg:px-0">
        {/* Left: editorial */}
        <div>
          <p className="mono-label text-[12px] text-amber">THE REAL SKILL</p>
          <h3 className="mt-5 font-display text-[32px] font-medium leading-[1.2] text-cream">
            Templates train. <em className="font-normal italic text-amber-bright">Attention</em>{' '}
            wins.
          </h3>
          <p className="mt-6 max-w-[480px] text-[16px] leading-[1.65] text-cream-dim">
            The masters never used lines — they used attention. These are training wheels: steal
            the structure, swap in what you actually noticed about her. A borrowed line with a real
            observation beats a perfect line with none.
          </p>
        </div>

        {/* Right: formula card on paper texture */}
        <div className="relative overflow-hidden rounded-lg border border-hairline p-8">
          <img
            src="/paper-texture.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="relative">
            <p className="mono-label text-[11px] text-cream-faint">THE OPEN FORMULA</p>
            <p className="mono-label mt-6 text-[13px] leading-[2.2] text-cream-dim">
              {FORMULA_TERMS.map((term, i) => (
                <span key={term}>
                  <motion.span
                    className="text-amber"
                    initial={{ opacity: 0.2 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.4, delay: 0.9 + i * 0.4, ease: EASE_EXPO }}
                  >
                    {term}
                  </motion.span>
                  {i < FORMULA_TERMS.length - 1 && <span className="text-cream-faint"> + </span>}
                </span>
              ))}
              <span className="text-cream-faint"> = </span>
              <motion.span
                className="text-amber-bright"
                initial={{ opacity: 0.2 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.4, delay: 0.9 + FORMULA_TERMS.length * 0.4, ease: EASE_EXPO }}
              >
                OPENER
              </motion.span>
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
