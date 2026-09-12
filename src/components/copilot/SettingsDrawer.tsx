import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Download, Trash2, X } from 'lucide-react';
import type { AISettings, EngineMode, SavedConvo } from '@/lib/engine';
import { loadFavs } from '@/lib/engine';
import { EASE_EXPO } from '@/lib/splitText';
import { cn } from '@/lib/utils';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: EngineMode;
  onModeChange: (m: EngineMode) => void;
  settings: AISettings;
  onSaveSettings: (s: AISettings) => void;
  onToast: (msg: string) => void;
  onClearData: () => void;
  savedConvos: SavedConvo[];
}

const MODES: { id: EngineMode; title: string; desc: string }[] = [
  { id: 'rules', title: 'RULES', desc: 'Offline, instant, private. Template + heuristic engine.' },
  { id: 'ai', title: 'AI', desc: 'Your key, your model, client-side only.' },
];

/** Section 6 — right-side settings sheet (copilot.md §6). */
export default function SettingsDrawer({
  open,
  onClose,
  mode,
  onModeChange,
  settings,
  onSaveSettings,
  onToast,
  onClearData,
  savedConvos,
}: SettingsDrawerProps) {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [endpoint, setEndpoint] = useState(settings.endpoint);
  const [model, setModel] = useState(settings.model);
  const [savedFlash, setSavedFlash] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (open) {
      setApiKey(settings.apiKey);
      setEndpoint(settings.endpoint);
      setModel(settings.model);
      setConfirmClear(false);
    }
  }, [open, settings]);

  const save = () => {
    onSaveSettings({ apiKey: apiKey.trim(), endpoint: endpoint.trim(), model: model.trim() });
    setSavedFlash(true);
    onToast('KEY SAVED LOCALLY');
    window.setTimeout(() => setSavedFlash(false), 1400);
  };

  const exportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      savedThreads: savedConvos,
      favoriteLines: loadFavs(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wingman-export.json';
    a.click();
    URL.revokeObjectURL(url);
    onToast('EXPORT DOWNLOADED');
  };

  const field =
    'mt-2 w-full rounded-md border border-hairline bg-surface-2 px-4 py-3 font-mono text-[13px] text-cream placeholder:text-cream-faint focus:border-amber/60 focus:outline-none focus:ring-[3px] focus:ring-glow';
  const label = 'mono-label block text-[10.5px] text-cream-faint';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[85] bg-ink/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[86] flex w-full flex-col border-l border-hairline bg-surface sm:w-[420px]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            role="dialog"
            aria-label="Settings"
          >
            <div className="flex items-center justify-between border-b border-hairline px-6 py-5">
              <p className="mono-label text-[12px] text-amber">SETTINGS</p>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center text-cream-dim transition-colors hover:text-cream"
                aria-label="Close settings"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* engine mode */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE_EXPO }}
              >
                <p className={label}>ENGINE MODE</p>
                <div className="mt-3 grid grid-cols-2 gap-3" role="radiogroup">
                  {MODES.map((m) => {
                    const active = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onModeChange(m.id)}
                        className={cn(
                          'rounded-lg border p-4 text-left transition-all duration-200 active:scale-[0.98]',
                          active
                            ? 'border-amber bg-amber/[0.08]'
                            : 'border-hairline bg-surface-2 hover:border-cream-faint',
                        )}
                      >
                        <span className={cn('mono-label text-[11px]', active ? 'text-amber' : 'text-cream')}>
                          {m.title}
                        </span>
                        <span className="mt-1.5 block text-[11.5px] leading-snug text-cream-dim">
                          {m.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* API fields */}
              <motion.div
                className="mt-7"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE_EXPO, delay: 0.06 }}
              >
                <label className={label} htmlFor="wm-apikey">OPENAI-COMPATIBLE KEY</label>
                <input
                  id="wm-apikey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-…"
                  autoComplete="off"
                  className={field}
                />
                <p className="mono-label mt-2 text-[9px] leading-relaxed text-cream-faint">
                  STORED ONLY IN YOUR BROWSER (localStorage). NEVER SENT ANYWHERE BUT YOUR ENDPOINT.
                </p>
              </motion.div>

              <motion.div
                className="mt-6 grid grid-cols-1 gap-5"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE_EXPO, delay: 0.12 }}
              >
                <div>
                  <label className={label} htmlFor="wm-endpoint">ENDPOINT</label>
                  <input
                    id="wm-endpoint"
                    type="text"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    autoComplete="off"
                    className={field}
                  />
                </div>
                <div>
                  <label className={label} htmlFor="wm-model">MODEL</label>
                  <input
                    id="wm-model"
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="gpt-4o-mini"
                    autoComplete="off"
                    className={field}
                  />
                </div>
              </motion.div>

              <motion.div
                className="mt-6"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE_EXPO, delay: 0.18 }}
              >
                <button
                  type="button"
                  onClick={save}
                  className={cn(
                    'btn-sheen mono-label w-full rounded-md px-6 py-3.5 text-[12px] font-semibold transition-all duration-300 active:scale-[0.97]',
                    savedFlash
                      ? 'bg-sage text-ink'
                      : 'bg-amber text-ink hover:bg-amber-bright',
                  )}
                >
                  {savedFlash ? (
                    <span className="inline-flex items-center gap-2">
                      <Check className="h-4 w-4" /> SAVED ✓
                    </span>
                  ) : (
                    'SAVE KEY'
                  )}
                </button>
              </motion.div>

              {/* data block */}
              <motion.div
                className="mt-9 border-t border-hairline pt-6"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE_EXPO, delay: 0.24 }}
              >
                <p className={label}>DATA</p>
                <div className="mt-3 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={exportJson}
                    className="mono-label inline-flex items-center justify-center gap-2 rounded-md border border-hairline px-5 py-3 text-[11px] text-cream transition-all duration-300 hover:border-amber hover:bg-surface-2 active:scale-[0.97]"
                  >
                    <Download className="h-3.5 w-3.5" /> EXPORT SAVED (JSON)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmClear) {
                        onClearData();
                        setConfirmClear(false);
                        onToast('LOCAL DATA CLEARED');
                      } else {
                        setConfirmClear(true);
                      }
                    }}
                    className={cn(
                      'mono-label inline-flex items-center justify-center gap-2 rounded-md border px-5 py-3 text-[11px] transition-all duration-300 active:scale-[0.97]',
                      confirmClear
                        ? 'border-wine bg-wine/15 text-wine'
                        : 'border-wine/50 text-wine hover:bg-wine/10',
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {confirmClear ? 'SURE?' : 'CLEAR ALL LOCAL DATA'}
                  </button>
                </div>
              </motion.div>
            </div>

            <p className="mono-label border-t border-hairline px-6 py-4 text-[9px] leading-relaxed text-cream-faint">
              AI CALLS ARE MADE DIRECTLY FROM YOUR BROWSER. RULES MODE NEVER LEAVES THE DEVICE.
            </p>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
