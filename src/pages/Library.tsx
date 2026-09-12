import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ConversationStage } from '@/lib/engine';
import { STORAGE_KEYS } from '@/lib/engine';
import type { ContextGroup, LibraryLine } from '@/lib/lines';
import { CONTEXT_GROUPS, LINES } from '@/lib/lines';
import { EASE_EXPO } from '@/lib/splitText';
import LibraryHeader from '@/components/library/LibraryHeader';
import type { ArsenalDef, ArsenalKey } from '@/components/library/FilterBar';
import FilterBar from '@/components/library/FilterBar';
import LineCard from '@/components/library/LineCard';
import LibraryToast from '@/components/library/LibraryToast';
import BuildYourOwn from '@/components/library/BuildYourOwn';
import CrossLinks from '@/components/library/CrossLinks';

const ARSENALS: ArsenalDef[] = [
  { key: 'all', label: 'ALL', count: LINES.length },
  { key: 'opener', label: 'OPENERS', count: LINES.filter((l) => l.category === 'opener').length },
  { key: 'banter', label: 'BANTER & ESCALATION', count: LINES.filter((l) => l.category === 'banter').length },
  { key: 'date-ask', label: 'DATE ASKS', count: LINES.filter((l) => l.category === 'date-ask').length },
  {
    key: 'exits-revivals',
    label: 'EXITS & REVIVALS',
    count: LINES.filter((l) => l.category === 'exit' || l.category === 'revival').length,
  },
];

function readFavs(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.favs);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts / denied clipboard permission.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      document.body.removeChild(ta);
    }
  }
}

export default function Library() {
  const [arsenal, setArsenal] = useState<ArsenalKey>('all');
  const [contextGroups, setContextGroups] = useState<ContextGroup[]>([]);
  const [stages, setStages] = useState<ConversationStage[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [favsOnly, setFavsOnly] = useState(false);
  const [favs, setFavs] = useState<string[]>(readFavs);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search debounce — 150ms (library.md §2).
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput.trim().toLowerCase()), 150);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Persist favorites (localStorage `wm:favs`).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.favs, JSON.stringify(favs));
    } catch {
      /* storage unavailable — favorites stay session-only */
    }
  }, [favs]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const toggleFav = useCallback(
    (id: string) => {
      setFavs((prev) => {
        const has = prev.includes(id);
        showToast(has ? 'REMOVED FROM FAVORITES' : 'SAVED TO FAVORITES');
        return has ? prev.filter((f) => f !== id) : [...prev, id];
      });
    },
    [showToast],
  );

  const handleCopy = useCallback(
    (line: LibraryLine) => {
      void copyText(line.text).then((ok) => {
        showToast(ok ? 'COPIED TO CLIPBOARD' : 'COPY FAILED — SELECT THE TEXT MANUALLY');
      });
    },
    [showToast],
  );

  const toggleContext = useCallback((group: ContextGroup) => {
    setContextGroups((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]));
  }, []);

  const toggleStage = useCallback((stage: ConversationStage) => {
    setStages((prev) => (prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]));
  }, []);

  const resetFilters = useCallback(() => {
    setArsenal('all');
    setContextGroups([]);
    setStages([]);
    setSearchInput('');
    setQuery('');
    setFavsOnly(false);
  }, []);

  const filtered = useMemo(() => {
    const allowedContexts = contextGroups.flatMap((g) => CONTEXT_GROUPS[g].contexts);
    return LINES.filter((line) => {
      if (arsenal === 'opener' && line.category !== 'opener') return false;
      if (arsenal === 'banter' && line.category !== 'banter') return false;
      if (arsenal === 'date-ask' && line.category !== 'date-ask') return false;
      if (arsenal === 'exits-revivals' && line.category !== 'exit' && line.category !== 'revival')
        return false;
      if (allowedContexts.length > 0 && !line.contexts.some((c) => allowedContexts.includes(c)))
        return false;
      if (stages.length > 0 && !stages.includes(line.stage)) return false;
      if (favsOnly && !favs.includes(line.id)) return false;
      if (
        query &&
        !`${line.text} ${line.principle} ${line.why}`.toLowerCase().includes(query)
      )
        return false;
      return true;
    });
  }, [arsenal, contextGroups, stages, favsOnly, favs, query]);

  return (
    <>
      <LibraryHeader count={LINES.length} arsenals={4} />

      <div className="mt-16">
        <FilterBar
          arsenals={ARSENALS}
          arsenal={arsenal}
          onArsenal={setArsenal}
          contextGroups={contextGroups}
          onToggleContext={toggleContext}
          stages={stages}
          onToggleStage={toggleStage}
          search={searchInput}
          onSearch={setSearchInput}
          favsOnly={favsOnly}
          onToggleFavsOnly={() => setFavsOnly((v) => !v)}
          shown={filtered.length}
        />
      </div>

      {/* Line card grid */}
      <section className="mx-auto max-w-[1200px] px-6 pb-28 pt-12 lg:px-0">
        {filtered.length > 0 ? (
          <motion.div layout className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((line, i) => (
                <LineCard
                  key={line.id}
                  line={line}
                  index={i}
                  isFav={favs.includes(line.id)}
                  onToggleFav={toggleFav}
                  onCopy={handleCopy}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_EXPO }}
            className="flex flex-col items-center rounded-lg border border-hairline bg-surface px-6 py-20 text-center"
          >
            <p className="font-display text-[26px] font-medium text-cream">
              Nothing in the arsenal matches.
            </p>
            <p className="mono-label mt-4 text-[11px] text-cream-faint">
              LOOSEN A FILTER — OR TRUST YOUR OWN OBSERVATION INSTEAD.
            </p>
            <button
              onClick={resetFilters}
              className="mono-label mt-8 rounded-md border border-hairline px-6 py-3 text-[12px] text-cream transition-all duration-300 ease-expo hover:border-amber hover:bg-surface-2 active:scale-[0.97]"
            >
              RESET FILTERS
            </button>
          </motion.div>
        )}
      </section>

      <BuildYourOwn />
      <CrossLinks />
      <LibraryToast message={toast} />
    </>
  );
}
