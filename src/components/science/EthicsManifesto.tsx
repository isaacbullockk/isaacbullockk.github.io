import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { splitWords } from '@/lib/splitText';

gsap.registerPlugin(ScrollTrigger);

/**
 * Science §5 — The Ethics Statement: a 28px manifesto revealed word-by-word
 * on a scrub over 50vh — the slow, deliberate read. GSAP-only tree.
 */
export default function EthicsManifesto() {
  const root = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const headRef = useRef<HTMLParagraphElement>(null);
  const signRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const split = splitWords(quoteRef.current!);
      gsap.set(split.targets, { opacity: 0.25, y: 12 });
      gsap.to(split.targets, {
        opacity: 1,
        y: 0,
        stagger: 0.03,
        ease: 'none',
        scrollTrigger: {
          trigger: quoteRef.current,
          start: 'top 82%',
          end: '+=50%',
          scrub: true,
        },
      });
      gsap.fromTo(
        headRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'expo.out',
          scrollTrigger: { trigger: root.current, start: 'top 75%' },
        },
      );
      gsap.fromTo(
        signRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.8,
          ease: 'expo.out',
          scrollTrigger: { trigger: signRef.current, start: 'top 92%' },
        },
      );
      return () => split.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden border-t border-hairline">
      <div className="absolute inset-0" aria-hidden>
        <img
          src="/paper-texture.png"
          alt=""
          className="h-full w-full object-cover opacity-[0.1]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_50%,transparent_0%,#121009_80%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[720px] px-6 py-24 md:py-32">
        <p ref={headRef} className="mono-label text-center text-[12px] text-amber">
          04 — THE LINE WE WON'T CROSS
        </p>
        <p
          ref={quoteRef}
          className="mt-12 font-display text-[22px] font-normal leading-[1.55] text-cream md:text-[28px] md:leading-[1.5]"
        >
          “Wingman exists to make you more attentive, more playful, and braver about asking —{' '}
          <em className="italic text-amber-bright">not to make you someone else.</em> We do not
          ship negging, pressure tactics, manufactured jealousy, or deception of any kind,
          because the research says they lose and because{' '}
          <em className="italic text-amber-bright">they're beneath you.</em> When interest
          fades, the co-pilot suggests one graceful swing and an exit with your dignity intact.{' '}
          <em className="italic text-amber-bright">Consent and enthusiasm</em> aren't obstacles
          to route around — they're the entire point.”
        </p>
        <p ref={signRef} className="mono-label mt-12 text-[11px] leading-[1.8] text-cream-faint">
          — THE HOUSE RULES, BINDING ON EVERY SUGGESTION THE ENGINE MAKES.
        </p>
      </div>
    </section>
  );
}
