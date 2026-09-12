import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { EASE_EXPO } from '@/lib/splitText';

const NAV = [
  { to: '/copilot', label: 'CO-PILOT' },
  { to: '/library', label: 'LIBRARY' },
  { to: '/playbook', label: 'PLAYBOOK' },
  { to: '/science', label: 'SCIENCE' },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-hairline bg-surface">
      {/* Watermark strip */}
      <motion.div
        aria-hidden
        className="pointer-events-none select-none whitespace-nowrap font-display text-[96px] font-medium leading-none tracking-[0.18em] text-cream"
        initial={{ opacity: 0.05, y: 20 }}
        whileInView={{ opacity: 0.08, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: EASE_EXPO }}
      >
        WINGMAN&nbsp;WINGMAN&nbsp;WINGMAN
      </motion.div>

      <div className="mx-auto grid max-w-[1200px] gap-12 px-6 pb-10 pt-4 md:grid-cols-3 lg:px-0">
        {/* Nav */}
        <div>
          <div className="mb-5 flex items-center gap-3">
            <img src="/wingman-mark.svg" alt="" className="h-5 w-5" />
            <span className="mono-label text-[12px] text-amber">NAVIGATE</span>
          </div>
          <ul className="space-y-3">
            {NAV.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="mono-label text-[12px] text-cream-dim transition-colors duration-300 hover:text-cream"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Ethics line */}
        <div>
          <p className="mono-label mb-5 text-[12px] text-amber">THE CODE</p>
          <p className="max-w-[280px] font-display text-[22px] italic leading-snug text-cream">
            Attention is the seduction. Everything else is noise.
          </p>
        </div>

        {/* Sources credit */}
        <div>
          <p className="mono-label mb-5 text-[12px] text-amber">RECEIPTS</p>
          <p className="text-[13px] leading-relaxed text-cream-dim">
            Built on Aron et&nbsp;al. (1997), Birnbaum &amp; Reis, Dutton &amp; Aron (1974),
            Hall, Jecker &amp; Landy, and the speed-dating literature on follow-up questions.
            No pickup folklore survives peer review here.
          </p>
        </div>
      </div>

      <div className="border-t border-hairline">
        <p className="mono-label mx-auto max-w-[1200px] px-6 py-5 text-[11px] text-cream-faint lg:px-0">
          BUILT ON PUBLISHED RESEARCH. BE HONEST. BE KIND. © 2025
        </p>
      </div>
    </footer>
  );
}
