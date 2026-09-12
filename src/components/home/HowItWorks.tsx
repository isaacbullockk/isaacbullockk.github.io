import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { splitWords } from '@/lib/splitText';

gsap.registerPlugin(ScrollTrigger);

const ARC_LEN = Math.PI * 80; // r=80 semicircle

/** Section 3 — How It Works (home.md §3). Pinned for 250vh, 3 scrub-driven acts. GSAP-only tree. */
export default function HowItWorks() {
  const root = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const h2Ref = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const stillWrapRef = useRef<HTMLDivElement>(null);
  const stillImgRef = useRef<HTMLImageElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const [act, setAct] = useState(0);

  useGSAP(
    () => {
      const acts = gsap.utils.toArray<HTMLElement>('[data-act]', pinRef.current);
      acts.forEach((a, i) => gsap.set(a, { autoAlpha: i === 0 ? 1 : 0, y: i === 0 ? 0 : 40 }));

      // Pinned act stack, scrub-driven (design.md §3)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinRef.current,
          start: 'top top',
          end: '+=250%',
          pin: true,
          scrub: 0.6,
          onUpdate: (self) => setAct(Math.min(2, Math.floor(self.progress * 3))),
        },
      });
      tl.to(acts[0], { y: -60, autoAlpha: 0, scale: 0.96, duration: 0.4 }, 0.24)
        .fromTo(acts[1], { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 }, 0.34)
        .to(acts[1], { y: -60, autoAlpha: 0, scale: 0.96, duration: 0.4 }, 0.6)
        .fromTo(acts[2], { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 }, 0.7);

      // Amber progress line fills down the left column
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: pinRef.current, start: 'top top', end: '+=250%', scrub: true },
        },
      );

      // H2 word-split reveal on entry
      const h2Split = splitWords(h2Ref.current!);
      gsap.fromTo(
        h2Split.targets,
        { yPercent: 110 },
        {
          yPercent: 0,
          stagger: 0.04,
          duration: 0.7,
          ease: 'expo.out',
          scrollTrigger: { trigger: h2Ref.current, start: 'top 88%' },
        },
      );

      // study-still: clip-path wipe + 8s ken-burns + caption fade
      gsap.fromTo(
        stillWrapRef.current,
        { clipPath: 'inset(12% 12% 12% 12%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 0.9,
          ease: 'expo.out',
          scrollTrigger: { trigger: stillWrapRef.current, start: 'top 70%' },
        },
      );
      gsap.fromTo(
        stillImgRef.current,
        { scale: 1.06 },
        {
          scale: 1,
          duration: 8,
          ease: 'none',
          scrollTrigger: { trigger: stillWrapRef.current, start: 'top 70%' },
        },
      );
      gsap.fromTo(
        captionRef.current,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'expo.out',
          scrollTrigger: { trigger: stillWrapRef.current, start: 'top 62%' },
        },
      );

      return () => h2Split.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative">
      {/* Pinned stage */}
      <div ref={pinRef} className="flex min-h-[100dvh] items-center overflow-hidden py-16">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20 lg:px-0">
          {/* Left column — sticky text + progress */}
          <div className="relative pl-8">
            <div
              ref={lineRef}
              aria-hidden
              className="absolute left-0 top-1 h-[calc(100%-8px)] w-[2px] origin-top bg-amber"
            />
            <p className="mono-label text-[12px] text-amber">N°02 — THE METHOD</p>
            <h2
              ref={h2Ref}
              className="mt-6 font-display text-[34px] font-medium leading-[1.1] text-cream md:text-[56px] md:leading-[1.05]"
            >
              Three moves. <em className="font-normal italic text-amber-bright">No guesswork.</em>
            </h2>
            <p className="mono-label mt-10 text-[12px] text-cream-dim">
              <span key={act} className="inline-block animate-fade-in text-amber-bright">
                0{act + 1}
              </span>
              <span className="text-cream-faint"> / 03</span>
            </p>
          </div>

          {/* Right column — act card stack */}
          <div className="relative h-[420px] w-full max-w-[460px] md:h-[400px]">
            {/* ACT 01 — PASTE */}
            <article
              data-act
              className="absolute inset-0 rounded-lg border border-hairline bg-surface p-7 shadow-[inset_0_1px_0_rgba(235,178,107,0.06)]"
            >
              <p className="mono-label text-[12px] text-amber">01 — PASTE</p>
              <p className="mt-4 text-[16px] leading-[1.6] text-cream-dim">
                Drop in the thread — Tinder, Hinge, iMessage, IG. Context selector tells the
                engine what room it’s in.
              </p>
              <div className="mt-6 rounded-md border border-hairline bg-surface-2 p-4">
                <p className="font-mono text-[11px] leading-relaxed text-cream-dim">
                  her: wait exactly that one. mezcal + old paper
                  <br />
                  her: is my whole personality
                  <br />
                  you:&nbsp;
                  <span className="animate-caret-blink text-amber">▍</span>
                </p>
                <div className="mt-3 flex gap-2">
                  {['TINDER', 'HINGE', 'IMESSAGE', 'IG'].map((c, i) => (
                    <span
                      key={c}
                      className={
                        i === 1
                          ? 'mono-label rounded border border-amber/60 px-2.5 py-1 text-[10px] text-amber'
                          : 'mono-label rounded border border-hairline px-2.5 py-1 text-[10px] text-cream-faint'
                      }
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            {/* ACT 02 — READ */}
            <article
              data-act
              className="absolute inset-0 rounded-lg border border-hairline bg-surface p-7 shadow-[inset_0_1px_0_rgba(235,178,107,0.06)]"
            >
              <p className="mono-label text-[12px] text-amber">02 — READ</p>
              <p className="mt-4 text-[16px] leading-[1.6] text-cream-dim">
                The analyzer classifies the stage, scores interest 0–100, and lists every signal
                it found — good and bad.
              </p>
              <div className="mt-4 flex items-end gap-5">
                <div className="relative">
                  <svg width="150" height="86" viewBox="0 0 200 120" aria-hidden>
                    <defs>
                      <linearGradient id="meterGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#B4683B" />
                        <stop offset="100%" stopColor="#EBB26B" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#241E17"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    <path
                      key={act}
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="url(#meterGrad)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={ARC_LEN}
                      className="animate-meter-sweep"
                      style={
                        {
                          '--meter-full': `${ARC_LEN}`,
                          '--meter-val': `${ARC_LEN * (1 - 0.74)}`,
                        } as React.CSSProperties
                      }
                    />
                  </svg>
                  <div className="absolute inset-x-0 bottom-0 text-center">
                    <span className="font-display text-[40px] font-medium leading-none text-cream">
                      74
                    </span>
                  </div>
                </div>
                <div>
                  <p className="mono-label text-[10px] text-cream-faint">INTEREST SIGNAL</p>
                  <p className="mono-label mt-1 text-[10px] text-sage">HOT &gt; 65</p>
                  <p className="mono-label mt-3 text-[10px] text-amber">STAGE — RAPPORT</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="mono-label rounded border border-sage/50 px-2.5 py-1 text-[10px] text-sage">
                  LAUGHS AT YOUR JOKES
                </span>
                <span className="mono-label rounded border border-sage/50 px-2.5 py-1 text-[10px] text-sage">
                  ASKS QUESTIONS BACK
                </span>
                <span className="mono-label rounded border border-hairline px-2.5 py-1 text-[10px] text-cream-dim">
                  MATCHES YOUR ENERGY
                </span>
              </div>
            </article>

            {/* ACT 03 — SUGGEST */}
            <article
              data-act
              className="absolute inset-0 rounded-lg border border-hairline bg-surface p-7 shadow-[inset_0_1px_0_rgba(235,178,107,0.06)]"
            >
              <p className="mono-label text-[12px] text-amber">03 — SUGGEST</p>
              <p className="mt-4 text-[16px] leading-[1.6] text-cream-dim">
                Three replies — Playful, Charming, Direct — each tagged with the research
                principle behind it. Copy, send, or regenerate.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  { tone: 'PLAYFUL', color: '#D08C46', text: 'A mezcal bookstore crawl is dangerously specific…' },
                  { tone: 'CHARMING', color: '#B4683B', text: 'The way you described that bookstore — the smell line…' },
                  { tone: 'DIRECT', color: '#9E4A38', text: 'I like this. Let’s do it in person — mezcal, Thursday…' },
                ].map((t) => (
                  <div
                    key={t.tone}
                    className="rounded-md border border-hairline bg-surface-2 p-3.5"
                    style={{ borderLeft: `2px solid ${t.color}` }}
                  >
                    <p className="mono-label text-[10px]" style={{ color: t.color }}>
                      {t.tone}
                    </p>
                    <p className="mt-1 truncate font-display text-[14px] italic text-cream-dim">
                      {t.text}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>

      {/* The Study — wide editorial image below the pin */}
      <div className="mx-auto max-w-[1200px] px-6 pb-32 lg:px-0">
        <div ref={stillWrapRef} className="overflow-hidden rounded-lg border border-hairline">
          <img
            ref={stillImgRef}
            src="/study-still.png"
            alt="A candlelit desk: fountain pen, brass, leather books — the Wingman study"
            className="h-auto w-full will-change-transform"
          />
        </div>
        <p ref={captionRef} className="mono-label mt-4 text-[11px] text-cream-faint">
          FIG. 02 — THE STUDY. WHERE FOLKLORE GOES TO DIE AND RESEARCH GETS A DRINK.
        </p>
      </div>
    </section>
  );
}
