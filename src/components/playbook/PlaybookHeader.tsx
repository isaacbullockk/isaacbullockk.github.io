import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { splitChars } from '@/lib/splitText';
import { CHAPTERS, chapterAnchor } from '@/lib/playbook';

gsap.registerPlugin(ScrollTrigger);

function scrollToChapter(n: number) {
  document
    .getElementById(chapterAnchor(n))
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Playbook §1 — Page header. Char-mask H1, fading sub, and a 2×5 chapter
 * index whose hairlines draw in sequentially. paper-texture backdrop at
 * 12% with a vignette to ink. GSAP-only tree.
 */
export default function PlaybookHeader() {
  const root = useRef<HTMLElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const indexRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const split = splitChars(h1Ref.current!);
      gsap.set(split.targets, { yPercent: 110 });

      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.fromTo(eyebrowRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, 0.15)
        .to(split.targets, { yPercent: 0, duration: 1, stagger: 0.045 }, 0.3)
        .fromTo(subRef.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, 1.0);

      // Chapter index: rows stagger 50ms, hairlines draw sequentially (scaleX 300ms)
      const rows = gsap.utils.toArray<HTMLElement>('[data-index-row]', indexRef.current);
      const rules = gsap.utils.toArray<HTMLElement>('[data-index-rule]', indexRef.current);
      tl.fromTo(
        rows,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 },
        1.15,
      ).fromTo(
        rules,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out' },
        1.2,
      );

      return () => split.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden">
      {/* paper-texture backdrop at 12%, vignetted to ink */}
      <div className="absolute inset-0" aria-hidden>
        <img
          src="/paper-texture.png"
          alt=""
          className="h-full w-full object-cover opacity-[0.12]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_38%,transparent_0%,#121009_78%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-ink" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px] px-6 pb-16 pt-[120px] text-center md:pb-20">
        <p ref={eyebrowRef} className="mono-label text-[12px] text-amber">
          THE CASANOVA PLAYBOOK
        </p>
        <h1
          ref={h1Ref}
          className="mx-auto mt-8 max-w-[900px] font-display text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-cream md:text-[64px]"
        >
          Seduction is <em className="font-normal italic text-amber-bright">attention</em>,
          weaponized kindly.
        </h1>
        <p
          ref={subRef}
          className="mx-auto mt-7 max-w-[560px] text-[17px] leading-[1.65] text-cream-dim md:text-[19px]"
        >
          Ten principles. Each with its study, its historical patron, and the lines that carry
          it. Master these and you won't need lines at all.
        </p>

        {/* Chapter index — 2 columns × 5, anchor links */}
        <div
          ref={indexRef}
          className="mx-auto mt-14 grid max-w-[820px] gap-x-12 text-left sm:grid-cols-2"
        >
          {CHAPTERS.map((c) => (
            <div key={c.n} data-index-row>
              <button
                onClick={() => scrollToChapter(c.n)}
                data-cursor-label="OPEN"
                className="group flex w-full items-baseline gap-4 py-3.5 text-left"
              >
                <span className="mono-label text-[12px] text-amber">
                  {String(c.n).padStart(2, '0')}
                </span>
                <span className="nav-underline mono-label text-[12px] text-cream-dim transition-colors duration-300 group-hover:text-cream">
                  {c.indexLabel}
                </span>
              </button>
              <div
                data-index-rule
                className="h-px origin-left bg-hairline will-change-transform"
                aria-hidden
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
