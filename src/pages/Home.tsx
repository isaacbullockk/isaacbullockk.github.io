import Hero from '@/components/home/Hero';
import Marquee from '@/components/home/Marquee';
import HowItWorks from '@/components/home/HowItWorks';
import ToneDemo from '@/components/home/ToneDemo';
import Masters from '@/components/home/Masters';
import ScienceStats from '@/components/home/ScienceStats';
import Ethics from '@/components/home/Ethics';
import FinalCta from '@/components/home/FinalCta';

/**
 * Home — `/` (home.md). Editorial landing: kinetic hero, principle marquee,
 * pinned how-it-works, live three-tones demo, Casanova teaser, science stats,
 * ethics, final CTA. GSAP and Framer sections are isolated sibling trees.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <HowItWorks />
      <ToneDemo />
      <Masters />
      <ScienceStats />
      <Ethics />
      <FinalCta />
    </>
  );
}
