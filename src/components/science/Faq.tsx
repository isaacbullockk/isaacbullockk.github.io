import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FAQ } from '@/lib/playbook';

gsap.registerPlugin(ScrollTrigger);

/**
 * Science §6 — FAQ: shadcn accordion, 800px centered column, mono uppercase
 * questions, cream-dim answers. List staggers in on scroll; items open with
 * a 300ms height animation and a 180° chevron turn.
 */
export default function Faq() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        gsap.utils.toArray<HTMLElement>('[data-faq-item]', root.current),
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.05,
          ease: 'expo.out',
          scrollTrigger: { trigger: root.current, start: 'top 78%' },
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} className="border-t border-hairline">
      <div className="mx-auto max-w-[800px] px-6 py-24 md:py-28">
        <p className="mono-label text-center text-[12px] text-amber">05 — QUESTIONS, ANSWERED</p>
        <h2 className="mt-6 text-center font-display text-[32px] font-medium leading-[1.1] text-cream md:text-[44px] md:leading-[1.05]">
          Fair <em className="font-normal italic text-amber-bright">questions.</em>
        </h2>

        <Accordion type="single" collapsible className="mt-12">
          {FAQ.map((item, i) => (
            <div key={item.q} data-faq-item>
              <AccordionItem value={`faq-${i}`} className="border-hairline">
                <AccordionTrigger className="mono-label py-5 text-[12px] font-medium text-cream hover:text-amber-bright hover:no-underline [&[data-state=open]>svg]:text-amber">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent
                  style={{ animationDuration: '300ms' }}
                  className="text-[15px] leading-[1.65] text-cream-dim"
                >
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            </div>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
