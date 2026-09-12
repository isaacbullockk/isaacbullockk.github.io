import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { EASE_EXPO } from '@/lib/splitText';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA install affordance (design §6 ghost-button language). Uses the
 * `beforeinstallprompt` event when the browser offers it; otherwise opens a
 * small tooltip with platform instructions (iOS: Share → Add to Home Screen).
 * Renders nothing once the app is installed / running standalone.
 */
export default function InstallHint() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  );
  const [helpOpen, setHelpOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setHelpOpen(false);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // close the help tooltip on outside tap
  useEffect(() => {
    if (!helpOpen) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setHelpOpen(false);
      }
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [helpOpen]);

  if (installed) return null;

  const onClick = async () => {
    if (deferred) {
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === 'accepted') setDeferred(null);
      } catch {
        /* user dismissed or prompt unavailable */
      }
      return;
    }
    setHelpOpen((o) => !o);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => void onClick()}
        className="mono-label inline-flex h-10 items-center gap-2 rounded-full border border-hairline px-4 text-[10.5px] text-cream-dim transition-all duration-300 hover:border-amber hover:text-cream active:scale-[0.95]"
        aria-expanded={helpOpen}
      >
        <Download className="h-3.5 w-3.5" />
        INSTALL APP
      </button>
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: EASE_EXPO }}
            className="absolute right-0 top-12 z-30 w-[260px] rounded-md border border-hairline bg-surface-2 p-4 shadow-[inset_0_1px_0_rgba(235,178,107,0.06)]"
            role="tooltip"
          >
            <p className="mono-label text-[10px] text-amber">— INSTALL WINGMAN</p>
            <p className="mt-2 text-[12px] leading-relaxed text-cream-dim">
              On iPhone: open the Share sheet in Safari, then tap{' '}
              <span className="text-cream">“Add to Home Screen”</span>. On Android or desktop:
              use the browser menu and choose{' '}
              <span className="text-cream">“Install app”</span>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
