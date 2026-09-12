import { useRef } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowUpRight } from 'lucide-react';
import { CITATIONS, chapterAnchor } from '@/lib/playbook';

gsap.registerPlugin(ScrollTrigger);

/**
 * Science §2 — The Sources: editorial numbered citation index on a
 * paper-texture panel. Rows reveal in stagger; the R-numbers tick up on
 * entry; each principle chip links to its Playbook chapter. GSAP-only tree.
 */
export default function CitationIndex() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const rows = gsap.utils.toArray<HTMLElement>('[data-cite-row]', root.current);
      gsap.fromTo(
        rows,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.06,
          ease: 'expo.out',
          scrollTrigger: { trigger: root.current, start: 'top 80%' },
        },
      );

      // Index numbers tick in with a quick counter animation
      const nums = gsap.utils.toArray<HTMLElement>('[data-rnum]', root.current);
      nums.forEach((el, i) => {
        const target = Number(el.dataset.rnum ?? '0');
        const state = { val: 0 };
        gsap.to(state, {
          val: target,
          duration: 0.1 + target * 0.06,
          delay: i * 0.06,
          ease: 'none',
          snap: { val: 1 },
          scrollTrigger: { trigger: root.current, start: 'top 80%' },
          onUpdate: () => {
            el.textContent = `R${Math.round(state.val)}`;
          },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="border-t border-hairline">
      <div className="mx-auto max-w-[1200px] px-6 py-24 md:py-28 lg:px-0">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mono-label text-[12px] text-amber">01 — THE SOURCES</p>
            <h2 className="mt-6 font-display text-[32px] font-medium leading-[1.1] text-cream md:text-[44px] md:leading-[1.05]">
              Every claim,{' '}
              <em className="font-normal italic text-amber-bright">indexed.</em>
            </h2>
          </div>
          <p className="mono-label max-w-[300px] text-[11px] leading-[1.8] text-cream-faint">
            TEN SOURCES. ZERO PICKUP FOLKLORE. CHIPS LINK TO THE MATCHING PLAYBOOK CHAPTER.
          </p>
        </div>

        {/* Citation panel */}
        <div className="relative mt-12 overflow-hidden rounded-lg border border-hairline bg-surface">
          <img
            src="/paper-texture.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.1]"
          />
          <ol className="relative">
            {CITATIONS.map((c, i) => (
              <li
                key={c.id}
                data-cite-row
                className="group grid gap-4 border-b border-hairline px-6 py-8 last:border-b-0 md:grid-cols-12 md:items-center md:px-9"
              >
                {/* Mono index */}
                <div className="md:col-span-1">
                  <span
                    data-rnum={i + 1}
                    className="mono-label text-[13px] text-amber"
                  >
                    R{i + 1}
                  </span>
                </div>

                {/* Citation + takeaway */}
                <div className="md:col-span-8">
                  <p className="text-[15px] leading-[1.6] text-cream">
                    {c.text}
                    {c.venue && (
                      <>
                        {' '}
                        <em className="font-display italic text-cream">{c.venue}</em>
                      </>
                    )}
                  </p>
                  <p className="mt-2.5 font-display text-[16px] italic leading-snug text-cream-dim">
                    → {c.takeaway}
                  </p>
                </div>

                {/* Principle chip → Playbook chapter */}
                <div className="md:col-span-3 md:justify-self-end">
                  <Link
                    to={
                      c.chapter === 0
                        ? '/playbook#masters'
                        : `/playbook#${chapterAnchor(c.chapter)}`
                    }
                    data-cursor-label="OPEN"
                    className="mono-label inline-flex items-center gap-2 rounded border border-copper/50 px-3 py-2 text-[10.5px] text-copper transition-all duration-300 hover:border-amber hover:text-amber-bright group-hover:border-copper group-hover:text-amber-bright"
                  >
                    {c.chip}
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
