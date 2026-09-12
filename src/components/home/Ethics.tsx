import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { splitWords } from '@/lib/splitText';

gsap.registerPlugin(ScrollTrigger);

/** Section 7 — The Code (home.md §7). Slow scrub-linked word-by-word read. GSAP-only tree. */
export default function Ethics() {
  const root = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const monoRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const split = splitWords(quoteRef.current!);
      gsap.set(split.targets, { opacity: 0.2, y: 24 });
      // Scrub-linked deliberate read: opacity 0.2 → 1 across 60vh
      gsap.to(split.targets, {
        opacity: 1,
        y: 0,
        stagger: 0.03,
        ease: 'none',
        scrollTrigger: {
          trigger: quoteRef.current,
          start: 'top 80%',
          end: '+=60%',
          scrub: true,
        },
      });
      gsap.fromTo(
        monoRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.8,
          ease: 'expo.out',
          scrollTrigger: { trigger: monoRef.current, start: 'top 88%' },
        },
      );
      return () => split.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="border-t border-hairline">
      <div className="mx-auto max-w-[680px] px-6 py-28 text-center md:py-40">
        <p className="mono-label text-[12px] text-amber">N°06 — THE CODE</p>
        <p
          ref={quoteRef}
          className="mt-10 font-display text-[26px] font-normal italic leading-[1.4] text-cream md:text-[40px] md:leading-[1.35]"
        >
          “No negging. No pressure. No pretending to be someone you’re not. When she says no — or
          goes quiet — Wingman coaches the graceful exit, not the second siege.”
        </p>
        <p ref={monoRef} className="mono-label mt-12 text-[11px] text-cream-faint">
          RESPONSIVENESS BEATS MANIPULATION. THE RESEARCH SAYS SO.
        </p>
      </div>
    </section>
  );
}
