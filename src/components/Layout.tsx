import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Cursor from '@/components/Cursor';

gsap.registerPlugin(ScrollTrigger);

/**
 * Shared site shell — nested-route (layout-route) pattern:
 * Layout renders <Outlet/>, App.tsx nests all page <Route>s inside it.
 *
 * The Navbar is fixed at 72px, so the content slot below owns the matching
 * offset. Full-bleed heroes opt out inside the page (negative top margin),
 * never by removing this padding. Page agents: do NOT add nav-height offsets.
 */
export default function Layout() {
  const { pathname } = useLocation();

  // Lenis smooth scroll site-wide (lerp 0.09), synced with GSAP ScrollTrigger.
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  // Scroll to top on route change.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    ScrollTrigger.refresh();
  }, [pathname]);

  return (
    <div className="min-h-[100dvh] bg-ink text-cream">
      <Cursor />
      <Navbar />
      <main className="pt-[72px]">
        <Outlet />
      </main>
      <Footer />
      <div className="grain-overlay" aria-hidden />
    </div>
  );
}
