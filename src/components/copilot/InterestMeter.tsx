import { useEffect, useId } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { InterestZone } from '@/lib/engine';
import { ZONE_LABELS } from '@/lib/engine';
import { cn } from '@/lib/utils';

/**
 * Interest Meter (design.md §6, copilot.md §4b) — 200° SVG arc gauge with a
 * copper→amber-bright gradient, ticks at 25/50/75, spring sweep
 * { stiffness: 60, damping: 14 } with a synced count-up. Below 35 the arc
 * shifts to a wine-tinted copper. Horizontal bar variant on mobile.
 */

const CX = 120;
const CY = 132;
const R = 100;
const START = 170; // degrees, y-down screen coords — arc opens at the bottom
const SWEEP = 200;

function polar(angleDeg: number, r: number): [number, number] {
  const a = (angleDeg * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function arcPath(): string {
  const [sx, sy] = polar(START, R);
  const [ex, ey] = polar(START + SWEEP, R);
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${R} ${R} 0 1 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

export default function InterestMeter({ value, zone }: { value: number; zone: InterestZone }) {
  const gid = useId();
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 60, damping: 14 });
  const rounded = useTransform(spring, (v) => Math.round(v));
  const dashOffset = useTransform(spring, (v) => 1 - Math.max(0, Math.min(100, v)) / 100);
  const barScale = useTransform(spring, (v) => Math.max(0, Math.min(100, v)) / 100);

  useEffect(() => {
    mv.set(0);
    // Give the spring a frame at zero so repeat analyses re-sweep.
    const t = window.setTimeout(() => mv.set(value), 30);
    return () => window.clearTimeout(t);
  }, [value, mv]);

  const cold = zone === 'cold';
  const from = cold ? '#9E4A38' : '#B4683B'; // wine-tinted copper when cold
  const to = cold ? '#B4683B' : '#EBB26B';
  const d = arcPath();

  return (
    <div>
      {/* Desktop / tablet arc */}
      <div className="relative mx-auto hidden w-full max-w-[280px] sm:block">
        <svg viewBox="0 0 240 168" className="w-full">
          <defs>
            <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          </defs>

          {/* track */}
          <path d={d} fill="none" stroke="#241E17" strokeWidth="10" strokeLinecap="round" />

          {/* ticks at 25 / 50 / 75 */}
          {[25, 50, 75].map((t) => {
            const ang = START + (t / 100) * SWEEP;
            const [x1, y1] = polar(ang, R - 11);
            const [x2, y2] = polar(ang, R - 18);
            return (
              <line
                key={t}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#6E6557"
                strokeWidth="1.5"
                opacity="0.7"
              />
            );
          })}

          {/* animated fill */}
          <motion.path
            d={d}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth="10"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            style={{ strokeDashoffset: dashOffset }}
          />
        </svg>

        {/* value + caption */}
        <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
          <div className="font-display text-[56px] font-medium leading-none text-cream">
            <motion.span>{rounded}</motion.span>
          </div>
          <p className="mono-label mt-1 text-[10.5px] text-cream-faint">INTEREST SIGNAL</p>
        </div>
      </div>

      {/* Mobile horizontal bar variant */}
      <div className="sm:hidden">
        <div className="flex items-end justify-between">
          <div className="font-display text-[44px] font-medium leading-none text-cream">
            <motion.span>{rounded}</motion.span>
          </div>
          <p className="mono-label text-[10.5px] text-cream-faint">INTEREST SIGNAL</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            className="h-full w-full origin-left rounded-full"
            style={{
              scaleX: barScale,
              background: `linear-gradient(90deg, ${from}, ${to})`,
            }}
          />
        </div>
        <div className="mono-label mt-2 flex justify-between text-[9px] text-cream-faint">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>

      {/* zone labels */}
      <div className="mono-label mt-4 flex items-center justify-center gap-2 text-[9.5px] text-cream-faint">
        <span className={cn(zone === 'cold' && 'text-wine')}>COLD &lt; 35</span>
        <span aria-hidden>·</span>
        <span className={cn(zone === 'warming' && 'text-amber')}>WARMING 35–65</span>
        <span aria-hidden>·</span>
        <span className={cn(zone === 'hot' && 'text-amber-bright')}>HOT &gt; 65</span>
      </div>
      <p className="sr-only">{ZONE_LABELS[zone]}</p>
    </div>
  );
}
