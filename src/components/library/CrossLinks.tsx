import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { EASE_EXPO } from '@/lib/splitText';

const LINKS = [
  {
    to: '/playbook',
    title: 'THE PLAYBOOK',
    note: 'Learn the principles behind every line.',
  },
  {
    to: '/copilot',
    title: 'THE CO-PILOT',
    note: 'Get suggestions written for your actual conversation.',
  },
];

/**
 * Library §5 — Cross-link ghost cards. Reveal staggered 0.12s, y 24px,
 * trigger 80%; hover warms the border and slides the arrow right 6px.
 */
export default function CrossLinks() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-24 lg:px-0">
      <div className="grid gap-6 md:grid-cols-2">
        {LINKS.map((link, i) => (
          <motion.div
            key={link.to}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.6, delay: i * 0.12, ease: EASE_EXPO }}
          >
            <Link
              to={link.to}
              className="group flex items-center justify-between gap-6 rounded-lg border border-hairline bg-transparent p-7 transition-all duration-300 ease-expo hover:border-amber/50 hover:bg-surface-2"
            >
              <div>
                <p className="font-display text-[24px] font-medium text-cream">{link.title}</p>
                <p className="mt-2 text-[14px] leading-[1.5] text-cream-dim">{link.note}</p>
              </div>
              <ArrowRight
                className="h-5 w-5 shrink-0 text-amber transition-transform duration-300 ease-expo group-hover:translate-x-1.5"
                aria-hidden
              />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
