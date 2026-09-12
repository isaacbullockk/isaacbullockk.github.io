import { useRef } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';
import { splitChars } from '@/lib/splitText';

gsap.registerPlugin(ScrollTrigger);

/**
 * Section 1 — Hero (home.md §1). Full-bleed glow, kinetic char-split serif,
 * breathing candlelight, parallaxing "W" watermark. GSAP-only tree.
 * Full-bleed opt-out: -mt-[72px] pulls it under the fixed nav.
 */
export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLImageElement>(null);
  const wmarkRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const line1 = useRef<HTMLSpanElement>(null);
  const line2 = useRef<HTMLSpanElement>(null);
  const line3 = useRef<HTMLSpanElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const microRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const splits = [line1, line2, line3].map((r) => splitChars(r.current!));
      splits.forEach((s) => gsap.set(s.targets, { yPercent: 110 }));

      // Load sequence (~1.8s total, design.md §1)
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.fromTo(glowRef.current, { scale: 1.08 }, { scale: 1, duration: 1.6 }, 0)
        .fromTo(eyebrowRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 0.25);
      splits.forEach((s, i) => {
        tl.to(s.targets, { yPercent: 0, duration: 1, stagger: 0.055 }, 0.4 + i * 0.1);
      });
      tl.fromTo(
        [subRef.current, ctaRef.current],
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 },
        1.0,
      ).fromTo(microRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 1.5);

      // Ambient: glow breathes (6s yoyo) after the load settle
      tl.add(() => {
        gsap.to(glowRef.current, {
          scale: 1.05,
          opacity: 0.66,
          duration: 6,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });
      });

      // Scroll: content parallaxes up at 0.85 speed, fades 30% over first 60vh
      gsap.to(contentRef.current, {
        yPercent: -15,
        opacity: 0.7,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: '60% top', scrub: true },
      });
      // Watermark W parallaxes at 0.4 scroll speed
      gsap.to(wmarkRef.current, {
        yPercent: 40,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      });

      return () => splits.forEach((s) => s.revert());
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative -mt-[72px] flex min-h-[100dvh] items-center overflow-hidden"
    >
      {/* Background: glow at 60% over ink + bottom gradient fade into ink */}
      <div className="absolute inset-0" aria-hidden>
        <img
          ref={glowRef}
          src="/hero-glow.png"
          alt=""
          className="h-full w-full object-cover opacity-60 will-change-transform"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-transparent to-ink" />
      </div>

      {/* Oversized italic "W" watermark, right edge, 6% */}
      <div
        ref={wmarkRef}
        aria-hidden
        className="pointer-events-none absolute -right-[4vw] top-1/2 hidden -translate-y-1/2 select-none font-display italic leading-none text-cream opacity-[0.06] md:block"
        style={{ fontSize: '40vw' }}
      >
        W
      </div>

      {/* Content — centered-left in the 1200px grid */}
      <div
        ref={contentRef}
        className="relative z-10 mx-auto w-full max-w-[1200px] px-6 pb-28 pt-[160px] lg:px-0"
      >
        <p ref={eyebrowRef} className="mono-label text-[12px] text-amber">
          N°01 — A DATING CHAT CO-PILOT
        </p>
        <h1 className="mt-8 font-display text-[44px] font-medium leading-[1.05] tracking-[-0.02em] text-cream md:text-[88px] md:leading-[1.0]">
          <span ref={line1} className="block">
            SAY THE
          </span>
          <span ref={line2} className="block">
            <em className="font-normal italic text-amber-bright">right</em> THING.
          </span>
          <span ref={line3} className="block">
            EVERY TIME.
          </span>
        </h1>
        <p ref={subRef} className="mt-8 max-w-[520px] text-[19px] leading-[1.65] text-cream-dim">
          Paste any conversation. Wingman reads the signals, names the stage, and writes your
          next move in three tones — each one backed by published psychology, not pickup folklore.
        </p>
        <div ref={ctaRef} className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            to="/copilot"
            className="btn-sheen mono-label inline-flex items-center gap-2.5 rounded-md bg-amber px-7 py-4 text-[14px] font-semibold tracking-[0.08em] text-ink transition-colors duration-300 hover:bg-amber-bright active:scale-[0.97]"
            style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '0.08em' }}
          >
            OPEN THE CO-PILOT
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/playbook"
            className="mono-label inline-flex items-center rounded-md border border-hairline px-7 py-4 text-[14px] font-semibold text-cream transition-all duration-300 hover:border-amber hover:bg-surface-2 active:scale-[0.97]"
            style={{ fontFamily: 'Manrope, sans-serif', letterSpacing: '0.08em' }}
          >
            READ THE PLAYBOOK
          </Link>
        </div>
        <p ref={microRef} className="mono-label mt-14 text-[11px] text-cream-faint">
          NO NEGGING. NO GAMES. JUST ATTENTION, TIMING, AND RESEARCH.
        </p>
      </div>
    </section>
  );
}
