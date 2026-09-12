import { useRef } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const MASTERS = [
  {
    name: 'Giacomo Casanova',
    dates: '1725–1798',
    move: 'The Spotlight: total attention, perfect recall.',
    chip: 'CURIOSITY',
    img: '/portrait-casanova.png',
  },
  {
    name: 'Lord Byron',
    dates: '1788–1824',
    move: 'The Specific Compliment: praise what no one else noticed.',
    chip: 'SPECIFICITY',
    img: '/portrait-byron.png',
  },
  {
    name: 'Benjamin Franklin',
    dates: '1706–1790',
    move: 'The Small Ask: a favor asked is a bond made.',
    chip: 'BEN FRANKLIN EFFECT',
    img: '/portrait-franklin.png',
  },
  {
    name: 'Frank Sinatra',
    dates: '1915–1998',
    move: 'The Presence: make her the only person in the room.',
    chip: 'FOCUS',
    img: '/portrait-sinatra.png',
  },
  {
    name: 'Porfirio Rubirosa',
    dates: '1909–1965',
    move: 'The Adventure Frame: sell the experience, not the interview.',
    chip: 'NOVELTY',
    img: '/portrait-rubirosa.png',
  },
];

/** Section 5 — The Casanova Teaser (home.md §5). Horizontal scrub over 200vh. GSAP-only tree. */
export default function Masters() {
  const root = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-master]', root.current);

      // Entry: stagger-tilt in
      gsap.fromTo(
        cards,
        { rotate: 2, y: 40, autoAlpha: 0 },
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

      // Desktop: scroll-jacked horizontal row over 200vh (native scroll on touch)
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', () => {
        gsap.fromTo(
          trackRef.current,
          { xPercent: 5 },
          {
            xPercent: -55,
            ease: 'none',
            scrollTrigger: {
              trigger: root.current,
              start: 'top top',
              end: '+=200%',
              pin: true,
              scrub: 0.6,
            },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="overflow-hidden border-y border-hairline bg-surface py-24 md:py-28 lg:flex lg:min-h-[100dvh] lg:flex-col lg:justify-center"
    >
      {/* Header */}
      <div className="mx-auto w-full max-w-[1200px] px-6 lg:px-0">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mono-label text-[12px] text-amber">N°04 — THE MASTERS</p>
            <h2 className="mt-6 font-display text-[34px] font-medium leading-[1.1] text-cream md:text-[56px] md:leading-[1.05]">
              Learned from the <em className="font-normal italic text-amber-bright">greats.</em>
            </h2>
          </div>
          <Link
            to="/playbook"
            className="mono-label group inline-flex items-center gap-2 text-[12px] text-cream-dim transition-colors duration-300 hover:text-amber"
          >
            FULL PLAYBOOK
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Horizontal row */}
      <div className="mt-14 overflow-x-auto lg:overflow-visible">
        <div ref={trackRef} className="flex w-max gap-6 px-6 will-change-transform lg:px-[8vw]">
          {MASTERS.map((m) => (
            <article
              key={m.name}
              data-master
              className="card-lift group h-[440px] w-[320px] shrink-0 overflow-hidden rounded-lg border border-hairline bg-ink"
            >
              <div className="h-[248px] overflow-hidden border-b border-hairline">
                <img
                  src={m.img}
                  alt={`Etched duotone portrait of ${m.name}`}
                  className="h-full w-full object-cover saturate-[0.72] transition-[filter,transform] [transition-duration:400ms] ease-expo group-hover:scale-[1.03] group-hover:saturate-[1.3]"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-[28px] font-medium leading-[1.2] text-cream">
                  {m.name}
                </h3>
                <p className="mono-label mt-1 text-[11px] text-cream-faint">{m.dates}</p>
                <p className="mt-3 font-display text-[16px] italic leading-snug text-cream-dim">
                  {m.move}
                </p>
                <span className="mono-label mt-4 inline-block rounded border border-copper/50 px-2.5 py-1 text-[10.5px] text-copper">
                  {m.chip}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
