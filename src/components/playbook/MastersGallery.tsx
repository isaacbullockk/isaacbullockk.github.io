import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { MASTERS, chapterAnchor, type Master } from '@/lib/playbook';

gsap.registerPlugin(ScrollTrigger);

function scrollToChapter(n: number) {
  document
    .getElementById(chapterAnchor(n))
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function MasterCard({ master, duplicate }: { master: Master; duplicate?: boolean }) {
  return (
    <button
      data-master-card
      data-cursor-label="OPEN"
      tabIndex={duplicate ? -1 : undefined}
      onClick={() => scrollToChapter(master.chapter)}
      aria-label={`${master.name} — jump to chapter ${master.chapter}`}
      className="group/card relative h-[300px] w-[240px] shrink-0 overflow-hidden rounded-lg border border-hairline bg-ink text-left transition-all duration-300 hover:-translate-y-1.5 hover:border-[rgba(235,178,107,0.28)]"
    >
      <img
        src={master.img}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover saturate-[0.7] transition-[filter,transform] [transition-duration:400ms] ease-expo group-hover/card:scale-[1.03] group-hover/card:saturate-[1.3]"
      />
      {/* vignette for legibility */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="font-display text-[20px] font-medium leading-[1.15] text-cream">
          {master.name}
        </h3>
        <p className="mono-label mt-1 text-[10.5px] text-cream-faint">{master.dates}</p>
        {/* mono caption slides up on hover */}
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-expo group-hover/card:grid-rows-[1fr]">
          <p className="mono-label overflow-hidden text-[10.5px] leading-[1.6] text-amber-bright">
            <span className="block pt-2.5">{master.chip}</span>
          </p>
        </div>
      </div>
    </button>
  );
}

/**
 * Playbook §3 — The Masters Gallery. Full-bleed surface band with a slow
 * auto-drift marquee (60s/loop) that pauses and warms on hover; clicking a
 * card smooth-scrolls to its chapter. GSAP-only tree.
 */
export default function MastersGallery() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-master-card]', root.current);
      gsap.fromTo(
        cards,
        { rotate: 1.5, y: 30, autoAlpha: 0 },
        {
          rotate: 0,
          y: 0,
          autoAlpha: 1,
          stagger: 0.08,
          duration: 0.8,
          ease: 'expo.out',
          scrollTrigger: { trigger: root.current, start: 'top 75%' },
        },
      );
      gsap.fromTo(
        '[data-gallery-head]',
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'expo.out',
          scrollTrigger: { trigger: root.current, start: 'top 78%' },
        },
      );
    },
    { scope: root },
  );

  // Four copies → the -50% keyframe always has a full half (2×5 cards ≈ 2600px)
  // covering any viewport; copies are aria-hidden duplicates.
  const copies = [0, 1, 2, 3];

  return (
    <section
      ref={root}
      id="masters"
      className="group scroll-mt-[100px] overflow-hidden border-y border-hairline bg-surface py-24 md:py-28"
      aria-label="The masters gallery"
    >
      <div data-gallery-head className="mx-auto max-w-[1200px] px-6 text-center lg:px-0">
        <p className="mono-label text-[12px] text-amber">THE PATRON SAINTS</p>
        <h3 className="mx-auto mt-6 font-display text-[34px] font-medium leading-[1.1] text-cream md:text-[48px] md:leading-[1.05]">
          Five men, <em className="font-normal italic text-amber-bright">one skill.</em>
        </h3>
        <p className="mx-auto mt-5 max-w-[520px] text-[15px] leading-[1.6] text-cream-dim">
          Different centuries, different rooms — the same undivided attention. Tap a portrait to
          visit his chapter.
        </p>
      </div>

      {/* Drift marquee — 60s/loop, pauses on hover */}
      <div className="mt-14 overflow-hidden">
        <div className="flex w-max animate-[marquee_60s_linear_infinite] gap-8 pl-8 will-change-transform group-hover:[animation-play-state:paused]">
          {copies.map((copy) => (
            <div key={copy} className="flex gap-8" aria-hidden={copy > 0}>
              {MASTERS.map((m) => (
                <MasterCard key={`${copy}-${m.id}`} master={m} duplicate={copy > 0} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
