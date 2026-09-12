import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { EASE_EXPO } from '@/lib/splitText';
import { cn } from '@/lib/utils';

const LINKS = [
  { to: '/copilot', label: 'CO-PILOT' },
  { to: '/library', label: 'LIBRARY' },
  { to: '/playbook', label: 'PLAYBOOK' },
  { to: '/science', label: 'SCIENCE' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const onHome = pathname === '/';

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-[72px] border-b border-hairline bg-ink/85 backdrop-blur-[12px]">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6 lg:px-10">
          {/* Wordmark */}
          <Link to="/" className="flex items-center gap-3" aria-label="Wingman home">
            <img src="/wingman-mark.svg" alt="" className="h-6 w-6" />
            <span className="font-display text-[17px] font-medium tracking-[0.28em] text-cream">
              WINGMAN
            </span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    'nav-underline mono-label text-[12px] transition-colors duration-300',
                    isActive ? 'text-amber' : 'text-cream-dim hover:text-cream',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/copilot"
              className={cn(
                'mono-label rounded-full px-5 py-2.5 text-[12px] font-medium transition-all duration-300 active:scale-[0.97]',
                onHome
                  ? 'bg-amber text-ink hover:bg-amber-bright'
                  : 'border border-hairline text-cream hover:border-amber hover:bg-surface-2',
              )}
            >
              OPEN CO-PILOT
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="flex h-10 w-10 items-center justify-center text-cream md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile full-screen overlay menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] flex flex-col bg-ink/[0.98] backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_EXPO }}
          >
            <div className="flex h-[72px] items-center justify-between border-b border-hairline px-6">
              <span className="flex items-center gap-3">
                <img src="/wingman-mark.svg" alt="" className="h-6 w-6" />
                <span className="font-display text-[17px] font-medium tracking-[0.28em] text-cream">
                  WINGMAN
                </span>
              </span>
              <button
                className="flex h-10 w-10 items-center justify-center text-cream"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col justify-center gap-2 px-8" aria-label="Mobile">
              {[{ to: '/', label: 'Home' }, ...LINKS.map((l) => ({ to: l.to, label: l.label.charAt(0) + l.label.slice(1).toLowerCase() }))].map(
                (l, i) => (
                  <motion.div
                    key={l.to}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE_EXPO, delay: 0.06 * i }}
                  >
                    <NavLink
                      to={l.to}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'block py-3 font-display text-[40px] font-medium leading-tight',
                          isActive ? 'italic text-amber-bright' : 'text-cream',
                        )
                      }
                    >
                      {l.label}
                    </NavLink>
                  </motion.div>
                ),
              )}
              <motion.p
                className="mono-label mt-10 text-[11px] text-cream-faint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                NO NEGGING. NO GAMES. JUST ATTENTION.
              </motion.p>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
