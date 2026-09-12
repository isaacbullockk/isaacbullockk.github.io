import { useRef } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';
import { splitChars } from '@/lib/splitText';

gsap.registerPlugin(ScrollTrigger);

/** Section 8 — Final CTA (home.md §8). Glow returns, flipped; "Your move." char-rise. GSAP-only tree. */
export default function FinalCta() {
  const root = useRef<HTMLElement>(null);
  const h2Ref = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const split = splitChars(h2Ref.current!);
      gsap.fromTo(
        split.targets,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1,
          stagger: 0.06,
          ease: 'expo.out',
          scrollTrigger: { trigger: h2Ref.current, start: 'top 75%' },
        },
      );
      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'expo.out',
          scrollTrigger: { trigger: h2Ref.current, start: 'top 70%' },
        },
      );
      return () => split.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative flex min-h-[80dvh] items-center justify-center overflow-hidden border-t border-hairline"
    >
      {/* Candlelight glow returns — flipped, 30% */}
      <div className="absolute inset-0 -scale-x-100" aria-hidden>
        <img
          src="/hero-glow.png"
          alt=""
          className="h-full w-full animate-breathe object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-transparent to-ink" />
      </div>

      <div className="relative z-10 px-6 text-center">
        <h2
          ref={h2Ref}
          className="font-display text-[56px] font-medium leading-[1.0] tracking-[-0.02em] text-cream md:text-[96px]"
        >
          Your <em className="font-normal italic text-amber-bright">move.</em>
        </h2>
        <div ref={ctaRef} className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/copilot"
            className="btn-sheen mono-label inline-flex items-center gap-2.5 rounded-md bg-amber px-7 py-4 text-[14px] font-semibold text-ink transition-colors duration-300 hover:bg-amber-bright active:scale-[0.97]"
            style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '0.08em' }}
          >
            OPEN THE CO-PILOT
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/library"
            className="mono-label inline-flex items-center rounded-md border border-hairline px-7 py-4 text-[14px] font-semibold text-cream transition-all duration-300 hover:border-amber hover:bg-surface-2 active:scale-[0.97]"
            style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '0.08em' }}
          >
            BROWSE THE LIBRARY
          </Link>
        </div>
      </div>
    </section>
  );
}
