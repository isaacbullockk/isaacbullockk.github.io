import { motion } from 'framer-motion';
import type { Signal } from '@/lib/engine';
import { EASE_EXPO } from '@/lib/splitText';
import { cn } from '@/lib/utils';

/**
 * Section 4c — detected signals, two mini-columns (▲ GREEN sage / ▼ RED
 * wine). Chips cascade in with a 40ms stagger, alternating columns.
 */
export default function SignalsPanel({
  signals,
  fading,
}: {
  signals: Signal[];
  fading: boolean;
}) {
  const green = signals.filter((s) => s.polarity !== 'negative');
  const red = signals.filter((s) => s.polarity === 'negative');

  const chip = (s: Signal, i: number, kind: 'green' | 'red') => (
    <motion.li
      key={`${s.label}-${i}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE_EXPO, delay: 0.15 + i * 0.04 }}
      className={cn(
        'mono-label inline-flex items-center gap-1.5 rounded border px-2.5 py-[5px] text-[10.5px] leading-none',
        kind === 'green'
          ? 'border-sage/35 text-sage'
          : 'border-wine/45 text-wine',
      )}
    >
      {s.label}
    </motion.li>
  );

  return (
    <div>
      <p className="mono-label text-[11px] text-cream-faint">SIGNALS DETECTED</p>

      <div className="mt-4 grid grid-cols-2 gap-6">
        <div>
          <p className="mono-label mb-3 text-[10px] text-sage">▲ GREEN</p>
          {green.length > 0 ? (
            <ul className="flex flex-wrap gap-2">{green.map((s, i) => chip(s, i * 2, 'green'))}</ul>
          ) : (
            <p className="mono-label text-[10.5px] text-cream-faint">— NONE YET</p>
          )}
        </div>
        <div>
          <p className="mono-label mb-3 text-[10px] text-wine">▼ RED</p>
          {red.length > 0 ? (
            <ul className="flex flex-wrap gap-2">{red.map((s, i) => chip(s, i * 2 + 1, 'red'))}</ul>
          ) : (
            <p className="mono-label text-[10.5px] text-cream-faint">— CLEAN</p>
          )}
        </div>
      </div>

      {fading && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="mono-label mt-5 border-l-2 border-wine pl-3 text-[10.5px] leading-relaxed text-wine"
        >
          FADING — ONE REVIVAL ATTEMPT, THEN EXIT WITH GRACE.
        </motion.p>
      )}
    </div>
  );
}
