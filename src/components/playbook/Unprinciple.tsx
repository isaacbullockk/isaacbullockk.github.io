import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { splitWords } from '@/lib/splitText';

gsap.registerPlugin(ScrollTrigger);

/**
 * Playbook §4 — The Unprinciple. Chapter 00, the ethics closer: a slow,
 * scrub-linked word-by-word read over 50vh on a paper-texture backdrop.
 * GSAP-only tree.
 */
export default function Unprinciple() {
  const root = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const headRef = useRef<HTMLParagraphElement>(null);
  const signRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const split = splitWords(quoteRef.current!);
      gsap.set(split.targets, { opacity: 0.25, y: 12 });
      // Word-by-word scrub reveal over 50vh — the slow deliberate read
      gsap.to(split.targets, {
        opacity: 1,
        y: 0,
        stagger: 0.03,
        ease: 'none',
        scrollTrigger: {
          trigger: quoteRef.current,
          start: 'top 82%',
          end: '+=50%',
          scrub: true,
        },
      });
      gsap.fromTo(
        headRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'expo.out',
          scrollTrigger: { trigger: root.current, start: 'top 75%' },
        },
      );
      gsap.fromTo(
        signRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.8,
          ease: 'expo.out',
          scrollTrigger: { trigger: signRef.current, start: 'top 90%' },
        },
      );
      return () => split.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden border-t border-hairline">
      {/* paper-texture backdrop at 15% */}
      <div className="absolute inset-0" aria-hidden>
        <img
          src="/paper-texture.png"
          alt=""
          className="h-full w-full object-cover opacity-[0.15]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_50%,transparent_0%,#121009_80%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[720px] px-6 py-28 text-center md:py-36">
        <p ref={headRef} className="mono-label text-[12px] text-amber">
          CHAPTER 00 — THE ONE THAT GOVERNS THE REST
        </p>
        <p
          ref={quoteRef}
          className="mt-12 font-display text-[26px] font-normal italic leading-[1.45] text-cream md:text-[36px] md:leading-[1.4]"
        >
          “Every master in this book was, before anything, honest in his attention. The moment
          you pressure, deceive, or diminish — you've left the playbook. Wingman will suggest
          the graceful exit instead. That's not a limitation. That's the craft.”
        </p>
        <p ref={signRef} className="mono-label mt-12 text-[11px] text-cream-faint">
          — THE HOUSE RULES
        </p>
      </div>
    </section>
  );
}
