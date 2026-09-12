import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings as Gear } from 'lucide-react';
import type {
  AISettings,
  AnalysisResult,
  ChatContext,
  EngineMode,
  Reply,
  SavedConvo,
} from '@/lib/engine';
import {
  DEFAULT_ENDPOINT,
  DEFAULT_MODEL,
  SAMPLE_THREAD,
  STORAGE_KEYS,
  loadAISettings,
  loadFavs,
  loadMode,
  loadSavedConvos,
  parseThread,
  persistAISettings,
  persistFavs,
  persistMode,
  persistSavedConvos,
  runAIAnalysis,
  runRulesAnalysis,
} from '@/lib/engine';
import { EASE_EXPO } from '@/lib/splitText';
import { cn } from '@/lib/utils';
import Toast from '@/components/copilot/Toast';
import EmptyState from '@/components/copilot/EmptyState';
import InputPanel from '@/components/copilot/InputPanel';
import StageStepper from '@/components/copilot/StageStepper';
import InterestMeter from '@/components/copilot/InterestMeter';
import SignalsPanel from '@/components/copilot/SignalsPanel';
import CoachingNote from '@/components/copilot/CoachingNote';
import Suggestions, { favId } from '@/components/copilot/Suggestions';
import SettingsDrawer from '@/components/copilot/SettingsDrawer';

type PageResult = AnalysisResult & { badge: string };

const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

export default function Copilot() {
  const [context, setContext] = useState<ChatContext>('hinge');
  const [herName, setHerName] = useState('');
  const [raw, setRaw] = useState('');
  const [mode, setModeState] = useState<EngineMode>(() => loadMode());
  const [settings, setSettings] = useState<AISettings>(() => loadAISettings());
  const [analyzing, setAnalyzing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [result, setResult] = useState<PageResult | null>(null);
  const [seed, setSeed] = useState(0);
  const [saved, setSaved] = useState<SavedConvo[]>(() => loadSavedConvos());
  const [favs, setFavs] = useState<string[]>(() => loadFavs());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2000);
  }, []);

  const setMode = useCallback((m: EngineMode) => {
    setModeState(m);
    persistMode(m);
  }, []);

  /* ------------------------------ analysis ------------------------------- */

  const performAnalysis = useCallback(
    async (rawText: string, ctx: ChatContext, name: string, seedVal: number) => {
      if (!rawText.trim()) return;
      setAnalyzing(true);
      const trimmedName = name.trim() || undefined;

      if (mode === 'ai' && settings.apiKey) {
        try {
          const messages = parseThread(rawText, trimmedName);
          const [ai] = await Promise.all([
            runAIAnalysis(messages, ctx, trimmedName, settings),
            sleep(500),
          ]);
          setResult({ ...ai, badge: `AI · ${(settings.model || DEFAULT_MODEL).toUpperCase()}` });
          setAnalyzing(false);
          return;
        } catch {
          // graceful fallback to the rules engine
          const fallback = runRulesAnalysis(rawText, ctx, trimmedName, seedVal);
          setResult({ ...fallback, badge: 'RULES ENGINE' });
          toast('AI UNREACHABLE — RULES ENGINE STEPPED IN');
          setAnalyzing(false);
          return;
        }
      }

      await sleep(600); // the reading beat
      setResult({ ...runRulesAnalysis(rawText, ctx, trimmedName, seedVal), badge: 'RULES ENGINE' });
      setAnalyzing(false);
    },
    [mode, settings, toast],
  );

  const onAnalyze = useCallback(
    () => performAnalysis(raw, context, herName, 0),
    [performAnalysis, raw, context, herName],
  );

  const onLoadSample = useCallback(() => {
    setRaw(SAMPLE_THREAD);
    setContext('hinge');
    void performAnalysis(SAMPLE_THREAD, 'hinge', herName, 0);
  }, [performAnalysis, herName]);

  const onRegenerate = useCallback(async () => {
    if (!result) return;
    if (mode === 'ai' && settings.apiKey) {
      setRegenerating(true);
      try {
        const messages = parseThread(raw, herName.trim() || undefined);
        const ai = await runAIAnalysis(messages, context, herName.trim() || undefined, settings);
        setResult({ ...ai, badge: `AI · ${(settings.model || DEFAULT_MODEL).toUpperCase()}` });
      } catch {
        toast('REGENERATE FAILED — KEEPING CURRENT READ');
      }
      setRegenerating(false);
    } else {
      // rules mode: shuffle template variants
      const next = seed + 1;
      setSeed(next);
      setRegenerating(true);
      await sleep(250);
      setResult({
        ...runRulesAnalysis(raw, context, herName.trim() || undefined, next),
        badge: 'RULES ENGINE',
      });
      setRegenerating(false);
    }
  }, [result, mode, settings, raw, context, herName, seed, toast]);

  /* --------------------------- saved threads ------------------------------ */

  const onSave = useCallback(() => {
    if (!result || !raw.trim()) return;
    const convo: SavedConvo = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: herName.trim(),
      context,
      savedAt: new Date().toISOString(),
      stage: result.stage,
      interest: result.interest,
      raw,
    };
    const next = [convo, ...saved].slice(0, 24);
    setSaved(next);
    persistSavedConvos(next);
    toast('THREAD SAVED');
  }, [result, raw, herName, context, saved, toast]);

  const onLoadConvo = useCallback(
    (c: SavedConvo) => {
      setRaw(c.raw);
      setContext(c.context);
      setHerName(c.name);
      void performAnalysis(c.raw, c.context, c.name, 0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [performAnalysis],
  );

  const onDeleteConvo = useCallback(
    (id: string) => {
      const next = saved.filter((c) => c.id !== id);
      setSaved(next);
      persistSavedConvos(next);
      toast('THREAD DELETED');
    },
    [saved, toast],
  );

  /* ------------------------------ favorites ------------------------------- */

  const onToggleFav = useCallback(
    (reply: Reply) => {
      const id = favId(reply);
      const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
      setFavs(next);
      persistFavs(next);
      toast(favs.includes(id) ? 'REMOVED FROM FAVORITES' : 'SAVED TO FAVORITES');
    },
    [favs, toast],
  );

  /* ------------------------------ settings -------------------------------- */

  const onSaveSettings = useCallback((s: AISettings) => {
    setSettings(s);
    persistAISettings(s);
  }, []);

  const onClearData = useCallback(() => {
    try {
      Object.values(STORAGE_KEYS).forEach((k) => window.localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    setSaved([]);
    setFavs([]);
    setModeState('rules');
    setSettings({ apiKey: '', endpoint: DEFAULT_ENDPOINT, model: DEFAULT_MODEL });
  }, []);

  const aiNeedsKey = mode === 'ai' && !settings.apiKey;

  return (
    <div className="bg-ink">
      {/* Section 1 — app header */}
      <motion.section
        className="mx-auto max-w-[1360px] px-6 pt-12 lg:px-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_EXPO }}
      >
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mono-label text-[12px] text-amber">— THE CO-PILOT</p>
            <h1 className="mt-4 font-display text-[34px] font-medium leading-[1.1] tracking-[-0.01em] text-cream md:text-[40px]">
              Read the room.{' '}
              <em className="font-normal italic text-amber-bright">Make the move.</em>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* mode toggle */}
            <div className="relative flex rounded-full bg-surface-2 p-1">
              {(['rules', 'ai'] as EngineMode[]).map((m) => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      'mono-label relative flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] transition-colors duration-300',
                      active ? 'text-amber' : 'text-cream-dim hover:text-cream',
                    )}
                    aria-pressed={active}
                  >
                    {active && (
                      <motion.span
                        layoutId="engine-mode-pill"
                        className="absolute inset-0 rounded-full border border-amber bg-amber/[0.14]"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      />
                    )}
                    <span className="relative">{m === 'rules' ? 'RULES' : 'AI'}</span>
                    {m === 'ai' && aiNeedsKey && (
                      <span className="group relative">
                        <span className="relative block h-[6px] w-[6px] rounded-full bg-wine" />
                        <span className="mono-label pointer-events-none absolute -top-9 right-0 z-10 whitespace-nowrap rounded border border-hairline bg-surface-2 px-2.5 py-1.5 text-[9px] text-cream-dim opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          ADD AN API KEY IN SETTINGS
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* settings gear */}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-cream-dim transition-all duration-300 hover:border-amber hover:text-cream active:scale-[0.95]"
              aria-label="Open settings"
            >
              <Gear className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* Sections 2–4 — input + results */}
      <section className="mx-auto max-w-[1360px] px-6 pt-10 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* input panel */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <InputPanel
                context={context}
                onContext={setContext}
                herName={herName}
                onHerName={setHerName}
                raw={raw}
                onRaw={setRaw}
                analyzing={analyzing}
                canSave={!!result && !analyzing}
                onAnalyze={onAnalyze}
                onLoadSample={onLoadSample}
                onSave={onSave}
                saved={saved}
                onLoadConvo={onLoadConvo}
                onDeleteConvo={onDeleteConvo}
              />
            </div>
          </div>

          {/* results column */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait" initial={false}>
              {!result ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <EmptyState />
                </motion.div>
              ) : (
                <motion.div
                  key={`results-${result.interest}-${result.stage}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  {/* 4a — stage stepper */}
                  <div className="rounded-lg border border-hairline bg-surface px-6 py-6">
                    <StageStepper stage={result.stage} />
                  </div>

                  {/* 4b — interest meter + verdict */}
                  <div className="grid gap-6 rounded-lg border border-hairline bg-surface p-6 md:grid-cols-2 md:items-center">
                    <InterestMeter value={result.interest} zone={result.zone} />
                    <div className="text-center md:text-left">
                      <motion.span
                        key={result.zone}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.12, delay: 1.0 }}
                        className={cn(
                          'mono-label inline-block rounded border px-3 py-1.5 text-[10.5px]',
                          result.zone === 'hot' && 'border-amber/50 text-amber-bright',
                          result.zone === 'warming' && 'border-amber/40 text-amber',
                          result.zone === 'cold' && 'border-wine/50 text-wine',
                        )}
                      >
                        {result.zone.toUpperCase()}
                      </motion.span>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: EASE_EXPO, delay: 1.05 }}
                        className="mt-4 font-display text-[20px] italic leading-[1.4] text-cream md:text-[22px]"
                      >
                        “{result.verdict}”
                      </motion.p>
                    </div>
                  </div>

                  {/* 4c — signals */}
                  <div className="rounded-lg border border-hairline bg-surface p-6">
                    <SignalsPanel signals={result.signals} fading={result.fading} />
                  </div>

                  {/* 4d — coaching note */}
                  <CoachingNote note={result.coachingNote} source={result.coachingSource} />

                  {/* Section 5 — suggestions */}
                  <Suggestions
                    replies={result.replies}
                    stalled={result.stage === 'stalled' || result.fading}
                    badge={result.badge}
                    aiMode={mode === 'ai' && result.badge.startsWith('AI')}
                    regenerating={regenerating}
                    favs={favs}
                    onToggleFav={onToggleFav}
                    onCopy={() => toast('COPIED TO CLIPBOARD')}
                    onRegenerate={onRegenerate}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Section 7 — ethics footer strip */}
      <motion.section
        className="mt-16 border-t border-hairline"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      >
        <p className="mono-label mx-auto max-w-[1360px] px-6 py-6 text-center text-[11px] leading-relaxed text-cream-faint lg:px-10">
          WINGMAN COACHES ATTENTION, NOT PRESSURE. A CLEAR NO — OR FADING INTEREST — GETS A
          GRACEFUL EXIT SUGGESTION. ALWAYS.
        </p>
      </motion.section>

      {/* settings drawer + toast */}
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        mode={mode}
        onModeChange={setMode}
        settings={settings}
        onSaveSettings={onSaveSettings}
        onToast={toast}
        onClearData={onClearData}
        savedConvos={saved}
      />
      <Toast message={toastMsg} />
    </div>
  );
}
