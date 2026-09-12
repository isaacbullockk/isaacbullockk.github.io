import { useRef } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  {
    value: 36,
    suffix: '',
    caption: 'questions that generate closeness, in escalating intimacy — Aron et al., 1997.',
    pulse: true,
  },
  {
    value: 2,
    suffix: '×',
    caption: 'more likely to be liked when you ask follow-up questions — speed-dating research.',
    pulse: false,
  },
  {
    value: 1974,
    suffix: '',
    caption: "the shaky-bridge study: arousal misattribution — why 'coffee?' loses to the night market.",
    pulse: false,
  },
];

/** Section 6 — The Science (home.md §6). Stats editorial with GSAP count-ups. GSAP-only tree. */
export default function ScienceStats() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const blocks = gsap.utils.toArray<HTMLElement>('[data-stat]', root.current);
      gsap.fromTo(
        blocks,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: 'expo.out',
          scrollTrigger: { trigger: root.current, start: 'top 75%' },
        },
      );

      const nums = gsap.utils.toArray<HTMLElement>('[data-count]', root.current);
      nums.forEach((el) => {
        const target = Number(el.dataset.count);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.2,
          ease: 'power2.out',
          snap: { v: 1 },
          onUpdate: () => {
            el.textContent = String(Math.round(obj.v));
          },
          scrollTrigger: { trigger: el, start: 'top 80%' },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="mx-auto max-w-[1200px] px-6 py-24 md:py-32 lg:px-0">
      <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
        {/* Left — editorial */}
        <div>
          <p className="mono-label text-[12px] text-amber">N°05 — RECEIPTS</p>
          <h2 className="mt-6 font-display text-[34px] font-medium leading-[1.1] text-cream md:text-[56px] md:leading-[1.05]">
            This isn’t <em className="font-normal italic text-amber-bright">folklore.</em>
          </h2>
          <p className="mt-6 max-w-[440px] text-[19px] leading-[1.65] text-cream-dim">
            Every suggestion is tagged with the study behind it. If we can’t cite it, we don’t
            ship it.
          </p>
          <Link
            to="/science"
            className="mono-label group mt-9 inline-flex items-center gap-2 rounded-md border border-hairline px-7 py-4 text-[14px] font-semibold text-cream transition-all duration-300 hover:border-amber hover:bg-surface-2 active:scale-[0.97]"
            style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '0.08em' }}
          >
            ALL SOURCES
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Right — stat blocks with hairline dividers */}
        <div>
          {STATS.map((s) => (
            <div key={s.caption} data-stat className="border-t border-hairline py-9 first:pt-0 last:border-b">
              <div className="flex items-baseline gap-1">
                <span
                  data-count={s.value}
                  className="font-display text-[56px] font-medium leading-none text-amber md:text-[72px]"
                >
                  0
                </span>
                {s.suffix && (
                  <span className="font-display text-[40px] font-medium leading-none text-amber md:text-[56px]">
                    {s.suffix}
                  </span>
                )}
              </div>
              {s.pulse && (
                <div className="mt-3 h-[2px] w-24 origin-left animate-pulse-underline bg-amber [animation-delay:1.5s]" />
              )}
              <p className="mt-4 max-w-[380px] text-[16px] leading-[1.6] text-cream-dim">
                {s.caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
