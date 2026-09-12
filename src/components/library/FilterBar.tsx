import { motion } from 'framer-motion';
import { Heart, Search } from 'lucide-react';
import type { ConversationStage } from '@/lib/engine';
import { STAGE_LABELS, STAGE_ORDER } from '@/lib/engine';
import type { ContextGroup } from '@/lib/lines';
import { CONTEXT_GROUPS } from '@/lib/lines';
import { EASE_EXPO } from '@/lib/splitText';
import { cn } from '@/lib/utils';

export type ArsenalKey = 'all' | 'opener' | 'banter' | 'date-ask' | 'exits-revivals';

export interface ArsenalDef {
  key: ArsenalKey;
  label: string;
  count: number;
}

interface FilterBarProps {
  arsenals: ArsenalDef[];
  arsenal: ArsenalKey;
  onArsenal: (key: ArsenalKey) => void;
  contextGroups: ContextGroup[];
  onToggleContext: (group: ContextGroup) => void;
  stages: ConversationStage[];
  onToggleStage: (stage: ConversationStage) => void;
  search: string;
  onSearch: (value: string) => void;
  favsOnly: boolean;
  onToggleFavsOnly: () => void;
  shown: number;
}

const CONTEXT_GROUP_ORDER: ContextGroup[] = ['apps', 'texting', 'instagram'];

/**
 * Library §2 — Sticky filter bar (top: 72px under the fixed navbar).
 * Slides down from −100% on page enter (400ms, 300ms delay).
 */
export default function FilterBar({
  arsenals,
  arsenal,
  onArsenal,
  contextGroups,
  onToggleContext,
  stages,
  onToggleStage,
  search,
  onSearch,
  favsOnly,
  onToggleFavsOnly,
  shown,
}: FilterBarProps) {
  return (
    <motion.div
      className="sticky top-[72px] z-40 border-b border-hairline bg-ink/[0.92] backdrop-blur-[12px]"
      initial={{ y: '-100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: EASE_EXPO }}
    >
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4 lg:px-0">
        {/* Arsenal tabs */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2" role="tablist" aria-label="Arsenal">
          {arsenals.map((a) => {
            const active = arsenal === a.key;
            return (
              <button
                key={a.key}
                role="tab"
                aria-selected={active}
                onClick={() => onArsenal(a.key)}
                className={cn(
                  'mono-label relative pb-1.5 text-[11px] transition-colors duration-300',
                  active ? 'text-cream' : 'text-cream-faint hover:text-cream-dim',
                )}
              >
                {a.label} ({a.count})
                <span
                  className={cn(
                    'absolute inset-x-0 bottom-0 h-[2px] bg-amber transition-transform duration-300 ease-expo',
                    active ? 'scale-x-100' : 'scale-x-0',
                  )}
                  style={{ transformOrigin: 'left' }}
                />
              </button>
            );
          })}
        </div>

        <span className="hidden h-5 w-px bg-hairline lg:block" aria-hidden />

        {/* Context chips (multi-select, copper accent) */}
        <div className="flex items-center gap-2" aria-label="Context filters">
          {CONTEXT_GROUP_ORDER.map((key) => {
            const active = contextGroups.includes(key);
            return (
              <button
                key={key}
                aria-pressed={active}
                onClick={() => onToggleContext(key)}
                className={cn(
                  'mono-label rounded border px-2.5 py-1.5 text-[10.5px] transition-all duration-300 active:scale-[0.97]',
                  active
                    ? 'border-copper/60 bg-copper/[0.14] text-copper'
                    : 'border-hairline text-cream-dim hover:border-copper/40 hover:text-cream',
                )}
              >
                {CONTEXT_GROUPS[key].label}
              </button>
            );
          })}
        </div>

        <span className="hidden h-5 w-px bg-hairline lg:block" aria-hidden />

        {/* Stage chips (multi-select, amber accent) */}
        <div className="flex flex-wrap items-center gap-2" aria-label="Stage filters">
          {STAGE_ORDER.map((stage) => {
            const active = stages.includes(stage);
            return (
              <button
                key={stage}
                aria-pressed={active}
                onClick={() => onToggleStage(stage)}
                className={cn(
                  'mono-label rounded border px-2.5 py-1.5 text-[10.5px] transition-all duration-300 active:scale-[0.97]',
                  active
                    ? 'border-amber/60 bg-amber/[0.14] text-amber'
                    : 'border-hairline text-cream-dim hover:border-amber/40 hover:text-cream',
                )}
              >
                {STAGE_LABELS[stage]}
              </button>
            );
          })}
        </div>

        {/* Right side: search + favorites + count */}
        <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="flex items-center gap-2 border-b border-hairline pb-1 transition-colors duration-300 focus-within:border-amber/60">
            <Search className="h-3.5 w-3.5 text-cream-faint" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="SEARCH LINES…"
              aria-label="Search lines"
              className="mono-label w-[150px] bg-transparent text-[11px] text-cream placeholder:text-cream-faint focus:outline-none"
            />
          </label>

          <button
            aria-pressed={favsOnly}
            onClick={onToggleFavsOnly}
            className={cn(
              'mono-label flex items-center gap-1.5 text-[11px] transition-colors duration-300',
              favsOnly ? 'text-copper' : 'text-cream-faint hover:text-cream-dim',
            )}
          >
            <Heart
              className={cn('h-3.5 w-3.5 transition-colors duration-300', favsOnly && 'fill-copper')}
              aria-hidden
            />
            FAVORITES ONLY
          </button>

          <span className="mono-label text-[11px] tabular-nums text-cream-faint">
            SHOWING {shown}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
