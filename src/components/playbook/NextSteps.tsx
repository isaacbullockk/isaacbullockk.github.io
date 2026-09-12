import { useRef } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const CARDS = [
  {
    to: '/copilot',
    eyebrow: 'PUT IT TO WORK',
    title: 'The Co-Pilot',
    note: 'Paste a real conversation and watch the principles fire.',
  },
  {
    to: '/library',
    eyebrow: 'STEAL THE LINES',
    title: 'The Library',
    note: 'Sixty-three openers, banter moves, asks, and graceful exits.',
  },
];

/** Playbook §5 — Next steps: two ghost cards, arrows slide on hover. GSAP-only tree. */
export default function NextSteps() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        gsap.utils.toArray<HTMLElement>('[data-next-card]', root.current),
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'expo.out',
          scrollTrigger: { trigger: root.current, start: 'top 75%' },
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} className="border-t border-hairline">
      <div className="mx-auto grid max-w-[1200px] gap-6 px-6 py-20 md:grid-cols-2 md:py-24 lg:px-0">
        {CARDS.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            data-next-card
            className="card-lift group relative overflow-hidden rounded-lg border border-hairline bg-surface p-9"
          >
            <img
              src="/paper-texture.png"
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.07]"
            />
            <div className="relative flex items-start justify-between gap-6">
              <div>
                <p className="mono-label text-[12px] text-amber">{c.eyebrow}</p>
                <h3 className="mt-4 font-display text-[28px] font-medium leading-[1.2] text-cream">
                  {c.title}
                </h3>
                <p className="mt-3 max-w-[340px] text-[14px] leading-[1.6] text-cream-dim">
                  {c.note}
                </p>
              </div>
              <ArrowRight className="mt-1 h-6 w-6 shrink-0 text-amber transition-transform duration-300 ease-expo group-hover:translate-x-2" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
