import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Check, CheckCircle2, Clipboard, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { splitWords } from '@/lib/splitText';
import { chapterAnchor, copyText, type Chapter } from '@/lib/playbook';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

function CopyChip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      toast('LINE COPIED TO CLIPBOARD');
      window.setTimeout(() => setCopied(false), 1400);
    } else {
      toast('COPY FAILED — SELECT MANUALLY');
    }
  };

  return (
    <button
      onClick={onCopy}
      data-cursor-label="COPY"
      aria-label="Copy line"
      className={cn(
        'mono-label inline-flex shrink-0 items-center gap-1.5 rounded border px-2.5 py-1.5 text-[11px] transition-all duration-150',
        copied
          ? 'scale-105 border-sage/60 text-sage opacity-100'
          : 'border-hairline text-cream-dim hover:border-amber hover:text-cream',
        'opacity-100 focus-visible:opacity-100 lg:opacity-0 lg:group-hover/line:opacity-100',
      )}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" />
          COPIED
        </>
      ) : (
        <>
          <Clipboard className="h-3 w-3" />
          COPY
        </>
      )}
    </button>
  );
}

/**
 * Playbook §2 — one principle chapter: oversized number, word-rise title,
 * THE SCIENCE + citation, THE MASTER portrait panel, three copyable example
 * lines with drawn left borders, and do/don't columns. GSAP-only tree.
 */
export default function ChapterRow({ chapter }: { chapter: Chapter }) {
  const root = useRef<HTMLElement>(null);
  const numRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const even = chapter.n % 2 === 0;

  useGSAP(
    () => {
      const split = splitWords(titleRef.current!);
      gsap.set(split.targets, { yPercent: 110 });

      const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]', root.current);
      const lineBorders = gsap.utils.toArray<HTMLElement>('[data-line-border]', root.current);
      const lineTexts = gsap.utils.toArray<HTMLElement>('[data-line-text]', root.current);

      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        scrollTrigger: { trigger: root.current, start: 'top 70%' },
      });
      // number fades in first (400ms)
      tl.fromTo(numRef.current, { opacity: 0 }, { opacity: 0.4, duration: 0.4 }, 0)
        // title words rise, 30ms stagger
        .to(split.targets, { yPercent: 0, duration: 0.9, stagger: 0.03 }, 0.1)
        // science/master/lines/do-don't slide up 36px, staggered 0.1s
        .fromTo(
          reveals,
          { opacity: 0, y: 36 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 },
          0.25,
        )
        // example-line left borders draw, then text fades
        .fromTo(
          lineBorders,
          { scaleY: 0 },
          { scaleY: 1, duration: 0.3, stagger: 0.1, ease: 'power2.out' },
          0.55,
        )
        .fromTo(
          lineTexts,
          { opacity: 0, x: -8 },
          { opacity: 1, x: 0, duration: 0.5, stagger: 0.1 },
          0.75,
        );

      return () => split.revert();
    },
    { scope: root },
  );

  const num = String(chapter.n).padStart(2, '0');

  return (
    <section
      ref={root}
      id={chapterAnchor(chapter.n)}
      className="scroll-mt-[100px] border-t border-hairline"
      aria-label={`Chapter ${num}: ${chapter.title}`}
    >
      <div className="mx-auto grid max-w-[1200px] gap-12 px-6 py-[72px] md:py-[90px] lg:grid-cols-12 lg:gap-14 lg:px-0">
        {/* Text side */}
        <div className={cn('relative lg:col-span-7', even && 'lg:order-2')}>
          {/* Oversized chapter number, behind content at 40% */}
          <div
            ref={numRef}
            aria-hidden
            className="pointer-events-none absolute -top-9 left-0 select-none font-mono text-[64px] leading-none text-cream-faint opacity-0"
          >
            {num}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-6">
            <h2
              ref={titleRef}
              className="font-display text-[30px] font-medium leading-[1.1] text-cream md:text-[40px]"
            >
              {chapter.title}
            </h2>
            <span className="mono-label rounded border border-copper/50 px-2.5 py-1 text-[10.5px] text-copper">
              {chapter.chip}
            </span>
          </div>

          {/* THE SCIENCE */}
          <div data-reveal className="mt-9">
            <p className="mono-label text-[12px] text-amber">THE SCIENCE</p>
            <p className="mt-4 max-w-[600px] text-[16px] leading-[1.65] text-cream-dim">
              {chapter.science}
            </p>
            <p className="mono-label mt-4 max-w-[600px] text-[12px] leading-[1.7] text-cream-faint">
              {chapter.citation}
            </p>
          </div>

          {/* Example lines */}
          <div data-reveal className="mt-10">
            <p className="mono-label text-[12px] text-amber">THE LINES</p>
            <div className="mt-5 space-y-4">
              {chapter.lines.map((line) => (
                <div
                  key={line}
                  className="group/line relative flex items-center justify-between gap-4 rounded-md border border-transparent py-3 pl-5 pr-3 transition-all duration-300 hover:translate-x-1 hover:border-hairline hover:bg-surface"
                >
                  <span
                    data-line-border
                    aria-hidden
                    className="absolute left-0 top-1/2 h-[70%] w-[2px] origin-top -translate-y-1/2 scale-y-0 bg-amber will-change-transform"
                  />
                  <p
                    data-line-text
                    className="font-display text-[17px] italic leading-[1.5] text-cream md:text-[18px]"
                  >
                    “{line}”
                  </p>
                  <CopyChip text={line} />
                </div>
              ))}
            </div>
          </div>

          {/* Do / Don't */}
          <div data-reveal className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="mono-label flex items-center gap-2 text-[12px] text-sage">
                <CheckCircle2 className="h-3.5 w-3.5" />
                WHEN TO USE
              </p>
              <ul className="mt-4 space-y-2.5">
                {chapter.do.map((d) => (
                  <li key={d} className="flex gap-2.5 text-[14px] leading-[1.55] text-cream-dim">
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-sage" aria-hidden />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mono-label flex items-center gap-2 text-[12px] text-wine">
                <XCircle className="h-3.5 w-3.5" />
                WHEN NOT TO
              </p>
              <ul className="mt-4 space-y-2.5">
                {chapter.dont.map((d) => (
                  <li key={d} className="flex gap-2.5 text-[14px] leading-[1.55] text-cream-dim">
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-wine" aria-hidden />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Master side */}
        <div className={cn('lg:col-span-5', even && 'lg:order-1')}>
          <div data-reveal className={cn('lg:sticky lg:top-[100px]', even ? 'lg:pr-2' : 'lg:pl-2')}>
            <p className="mono-label text-[12px] text-amber">THE MASTER</p>
            <div className="group relative mt-5 overflow-hidden rounded-lg border border-hairline bg-surface p-7">
              {/* paper texture in panel */}
              <img
                src="/paper-texture.png"
                alt=""
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.08]"
              />
              <div className="relative">
                <div className="h-[120px] w-[120px] overflow-hidden rounded-lg border border-hairline">
                  <img
                    src={chapter.master.img}
                    alt={`Etched duotone portrait of ${chapter.master.name}`}
                    className="h-full w-full object-cover saturate-[0.72] transition-[filter,transform] [transition-duration:400ms] ease-expo group-hover:scale-[1.02] group-hover:saturate-[1.3]"
                  />
                </div>
                <h3 className="mt-5 font-display text-[26px] font-medium leading-[1.2] text-cream">
                  {chapter.master.name}
                </h3>
                <p className="mono-label mt-1.5 text-[11px] text-cream-faint">
                  {chapter.master.dates}
                </p>
                <p className="mt-4 text-[14px] leading-[1.65] text-cream-dim">
                  {chapter.master.anecdote}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
