import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { splitChars } from '@/lib/splitText';

gsap.registerPlugin(ScrollTrigger);

/**
 * Science §1 — Page header: eyebrow, char-mask H1, fading sub on the
 * 1200px grid with a faint paper-texture backdrop. GSAP-only tree.
 */
export default function ScienceHeader() {
  const root = useRef<HTMLElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const split = splitChars(h1Ref.current!);
      gsap.set(split.targets, { yPercent: 110 });

      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.fromTo(eyebrowRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, 0.15)
        .to(split.targets, { yPercent: 0, duration: 1, stagger: 0.045 }, 0.3)
        .fromTo(subRef.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 }, 1.0);

      return () => split.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden">
      <div className="absolute inset-0" aria-hidden>
        <img
          src="/paper-texture.png"
          alt=""
          className="h-full w-full object-cover opacity-[0.08]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_30%,transparent_0%,#121009_78%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px] px-6 pb-16 pt-[96px] md:pb-20 lg:px-0">
        <p ref={eyebrowRef} className="mono-label text-[12px] text-amber">
          RECEIPTS &amp; METHOD
        </p>
        <h1
          ref={h1Ref}
          className="mt-8 max-w-[900px] font-display text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-cream md:text-[64px]"
        >
          Cited, or it <em className="font-normal italic text-amber-bright">doesn't ship.</em>
        </h1>
        <p
          ref={subRef}
          className="mt-7 max-w-[620px] text-[17px] leading-[1.65] text-cream-dim md:text-[18px]"
        >
          Wingman's rule engine is a direct implementation of published psychology and
          documented historical practice. Here's every source, how the machine works, and the
          lines we refuse to cross.
        </p>
      </div>
    </section>
  );
}
