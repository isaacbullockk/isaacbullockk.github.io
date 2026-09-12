import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

/** Science §7 — Colophon: slim mono strip, fades in at 80% trigger. GSAP-only tree. */
export default function Colophon() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        root.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.8,
          ease: 'expo.out',
          scrollTrigger: { trigger: root.current, start: 'top 80%' },
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} className="border-t border-hairline">
      <p className="mono-label mx-auto max-w-[1200px] px-6 py-8 text-center text-[11px] leading-[1.9] text-cream-faint lg:px-0">
        SET IN FRAUNCES, MANROPE &amp; IBM PLEX MONO · ETCHED PORTRAITS IN AMBER DUOTONE · NO
        HEARTS WERE CLIPARTED IN THE MAKING OF THIS SITE.
      </p>
    </section>
  );
}
