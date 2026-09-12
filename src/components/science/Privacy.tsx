import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { HardDrive, KeyRound, Trash2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const BLOCKS = [
  {
    icon: HardDrive,
    head: 'LOCAL BY DEFAULT',
    text: 'Conversations, favorites, and saved threads live in your browser\u2019s localStorage. Nothing is sent to any server — there is no Wingman server.',
  },
  {
    icon: KeyRound,
    head: 'YOUR KEY, YOUR BROWSER',
    text: 'AI mode calls your OpenAI-compatible endpoint directly from your device. The key never touches our infrastructure because we don\u2019t have any.',
  },
  {
    icon: Trash2,
    head: 'DELETE ANYTIME',
    text: 'Settings → Clear all local data. Gone means gone — we can\u2019t recover what we never held.',
  },
];

/**
 * Science §4 — Privacy: three mono-headed guarantees in a hairline panel.
 * Blocks stagger in; each header's amber tick draws (scaleX) on entry.
 * GSAP-only tree.
 */
export default function Privacy() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const blocks = gsap.utils.toArray<HTMLElement>('[data-privacy]', root.current);
      const ticks = gsap.utils.toArray<HTMLElement>('[data-tick]', root.current);
      gsap.fromTo(
        blocks,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: 'expo.out',
          scrollTrigger: { trigger: root.current, start: 'top 78%' },
        },
      );
      gsap.fromTo(
        ticks,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.5,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: { trigger: root.current, start: 'top 78%' },
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} className="border-t border-hairline">
      <div className="mx-auto max-w-[1200px] px-6 py-24 md:py-28 lg:px-0">
        <p className="mono-label text-[12px] text-amber">03 — PRIVACY</p>
        <h2 className="mt-6 font-display text-[32px] font-medium leading-[1.1] text-cream md:text-[44px] md:leading-[1.05]">
          Your business stays{' '}
          <em className="font-normal italic text-amber-bright">your business.</em>
        </h2>

        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-hairline bg-hairline md:grid-cols-3">
          {BLOCKS.map((b) => (
            <div key={b.head} data-privacy className="bg-surface p-8 md:p-9">
              <b.icon className="h-5 w-5 text-amber" />
              <div
                data-tick
                aria-hidden
                className="mt-5 h-[2px] w-9 origin-left bg-amber will-change-transform"
              />
              <h3 className="mono-label mt-4 text-[12px] text-cream">{b.head}</h3>
              <p className="mt-3.5 text-[14px] leading-[1.65] text-cream-dim">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
