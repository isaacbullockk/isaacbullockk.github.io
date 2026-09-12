import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { KeyRound } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    n: '01',
    label: 'PARSE',
    text: 'The pasted thread is split into turns and attributed — who said what, and when.',
  },
  {
    n: '02',
    label: 'READ',
    text: 'Heuristics score interest signals (reply length deltas, questions back, latency, laughter density, initiative) and classify the stage: Opener → Rapport → Building → The Ask → Stalled.',
  },
  {
    n: '03',
    label: 'COACH',
    text: 'The highest-leverage principle for the current state becomes the coaching note — with its citation attached.',
  },
  {
    n: '04',
    label: 'WRITE',
    text: 'Three templates are instantiated with conversation details — her name, callbacks, shared interests — in the three tones.',
  },
];

/**
 * Science §3 — How the Engine Works: left, the four-step pipeline copy;
 * right, a stacked node diagram with hairline connectors and amber dots,
 * drawn in sequence on scroll. GSAP-only tree.
 */
export default function EnginePipeline() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Left copy staggers up
      gsap.fromTo(
        gsap.utils.toArray<HTMLElement>('[data-pipe-copy]', root.current),
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'expo.out',
          scrollTrigger: { trigger: root.current, start: 'top 75%' },
        },
      );

      // Diagram: nodes pop in sequence (120ms), connectors draw (250ms each)
      const nodes = gsap.utils.toArray<HTMLElement>('[data-node]', root.current);
      const links = gsap.utils.toArray<HTMLElement>('[data-link]', root.current);
      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        scrollTrigger: { trigger: '[data-diagram]', start: 'top 75%' },
      });
      nodes.forEach((node, i) => {
        tl.fromTo(
          node,
          { opacity: 0, scale: 0.94, y: 14 },
          { opacity: 1, scale: 1, y: 0, duration: 0.45 },
          i * 0.12 + i * 0.25,
        );
        if (i < links.length) {
          tl.fromTo(
            links[i],
            { scaleY: 0 },
            { scaleY: 1, duration: 0.25, ease: 'power2.out' },
            i * 0.12 + i * 0.25 + 0.35,
          );
        }
      });
      tl.fromTo(
        '[data-ai-note]',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6 },
        '>-0.1',
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} className="border-t border-hairline bg-surface/40">
      <div className="mx-auto grid max-w-[1200px] gap-14 px-6 py-24 md:py-28 lg:grid-cols-2 lg:gap-20 lg:px-0">
        {/* Left — pipeline copy */}
        <div>
          <p data-pipe-copy className="mono-label text-[12px] text-amber">
            02 — UNDER THE HOOD
          </p>
          <h2
            data-pipe-copy
            className="mt-6 font-display text-[32px] font-medium leading-[1.1] text-cream md:text-[44px] md:leading-[1.05]"
          >
            A rule engine with{' '}
            <em className="font-normal italic text-amber-bright">citations.</em>
          </h2>
          <p data-pipe-copy className="mt-6 max-w-[520px] text-[16px] leading-[1.65] text-cream-dim">
            No black box, no vibes-based matching. Every suggestion the co-pilot makes travels
            the same four-step pipeline — and every step maps to the sources above.
          </p>

          <ol className="mt-10 space-y-8">
            {STEPS.map((s) => (
              <li key={s.n} data-pipe-copy className="flex gap-5">
                <span className="mono-label mt-0.5 shrink-0 text-[13px] text-amber">{s.n}</span>
                <div>
                  <h3 className="mono-label text-[13px] text-cream">{s.label}</h3>
                  <p className="mt-2 max-w-[480px] text-[15px] leading-[1.6] text-cream-dim">
                    {s.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Right — stacked diagram card */}
        <div data-diagram className="lg:pt-16">
          <div className="relative overflow-hidden rounded-lg border border-hairline bg-surface p-8 md:p-10">
            <img
              src="/paper-texture.png"
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.08]"
            />
            <div className="relative">
              <p className="mono-label text-[11px] text-cream-faint">THE PIPELINE</p>
              <div className="mt-6">
                {STEPS.map((s, i) => (
                  <div key={s.n}>
                    <div
                      data-node
                      className="flex items-center gap-4 rounded-md border border-hairline bg-surface-2 px-5 py-4 will-change-transform"
                    >
                      <span
                        aria-hidden
                        className="h-2 w-2 shrink-0 rounded-full bg-amber shadow-[0_0_10px_rgba(235,178,107,0.5)]"
                      />
                      <span className="mono-label text-[12px] text-cream">{s.label}</span>
                      <span className="mono-label ml-auto text-[11px] text-cream-faint">
                        STEP {s.n}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="flex justify-center py-1" aria-hidden>
                        <div
                          data-link
                          className="h-7 w-px origin-top bg-[rgba(239,231,213,0.22)] will-change-transform"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI-mode note */}
          <div
            data-ai-note
            className="mt-5 flex items-start gap-3.5 rounded-lg border border-amber/30 bg-surface px-6 py-5"
          >
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
            <p className="mono-label text-[11.5px] leading-[1.8] text-cream-dim">
              <span className="text-amber">AI MODE:</span> SAME PIPELINE, WITH YOUR MODEL
              WRITING STEP 04. YOUR KEY, YOUR BROWSER, YOUR CALLS.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
