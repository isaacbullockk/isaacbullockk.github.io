import { motion } from 'framer-motion';

const ITEMS = [
  'SELF-DISCLOSURE',
  'RESPONSIVENESS',
  'PLAYFULNESS',
  'SPECIFICITY',
  'MOMENTUM',
  'THE SMALL ASK',
  'NOVELTY',
  'KNOWN LIKING',
  'THE CALLBACK',
  'GRACEFUL EXITS',
];

/** Section 2 — Principle Marquee (home.md §2). 60px strip, 40s loop, pauses on hover. */
export default function Marquee() {
  return (
    <section className="border-y border-hairline bg-surface" aria-label="Principles">
      <motion.div
        className="flex h-[60px] items-center overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.9 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex w-max animate-marquee items-center hover:[animation-play-state:paused]">
          {[...ITEMS, ...ITEMS].map((item, i) => (
            <span key={i} className="flex items-center">
              <span className="mono-label whitespace-nowrap text-[13px] text-cream-dim">
                {item}
              </span>
              <span className="mx-8 text-[8px] text-amber" aria-hidden>
                ◆
              </span>
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
