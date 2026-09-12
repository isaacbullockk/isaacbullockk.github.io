import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { splitChars } from '@/lib/splitText';

/**
 * Library §1 — Page header. GSAP-only tree (char-split masked rise for the H1,
 * 50ms stagger; sub + count fade up on load). Kept free of Framer Motion per
 * the library-isolation rule.
 */
export default function LibraryHeader({ count, arsenals }: { count: number; arsenals: number }) {
  const root = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const metaRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const split = splitChars(h1Ref.current!);
      gsap.set(split.targets, { yPercent: 110 });

      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.fromTo(eyebrowRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, 0.1)
        .to(split.targets, { yPercent: 0, duration: 0.9, stagger: 0.05 }, 0.25)
        .fromTo(
          [subRef.current, metaRef.current],
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.12 },
          0.8,
        );

      return () => split.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="mx-auto max-w-[1200px] px-6 pt-24 lg:px-0">
      <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-[640px]">
          <p ref={eyebrowRef} className="mono-label text-[12px] text-amber">
            N° — THE ARSENAL
          </p>
          <h1
            ref={h1Ref}
            className="mt-6 font-display text-[44px] font-medium leading-[1.05] tracking-[-0.02em] text-cream md:text-[64px]"
          >
            Lines with <em className="font-normal italic text-amber-bright">receipts.</em>
          </h1>
          <p ref={subRef} className="mt-6 max-w-[560px] text-[18px] leading-[1.65] text-cream-dim">
            Every line here exists because a principle says it works — the tag under each one names
            the study or the master it descends from. Steal them, then make them yours.
          </p>
        </div>
        <p ref={metaRef} className="mono-label shrink-0 text-[12px] text-cream-faint md:pb-2 md:text-right">
          {count} LINES · {arsenals} ARSENALS
        </p>
      </div>
    </section>
  );
}
