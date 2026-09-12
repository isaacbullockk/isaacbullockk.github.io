/**
 * Wingman lines library — shared data foundation (design.md §8, library.md).
 *
 * The Library page (/library) renders ~63 filterable lines with copy +
 * favorites (localStorage `wm:favs`). This file defines the data structure
 * and seeds it; the Library page agent extends LINES to full coverage.
 */

import type { ChatContext, Tone } from './engine';

export type LineCategory = 'opener' | 'banter' | 'date-ask' | 'exit' | 'revival';

export const CATEGORY_LABELS: Record<LineCategory, string> = {
  opener: 'OPENERS',
  banter: 'BANTER',
  'date-ask': 'DATE ASKS',
  exit: 'GRACEFUL EXITS',
  revival: 'REVIVALS',
};

export interface LibraryLine {
  id: string;
  category: LineCategory;
  tone: Tone;
  text: string;
  /** Mono chip — the principle the line demonstrates. */
  principle: string;
  /** Published source behind the principle, when one exists. */
  citation?: string;
  contexts: ChatContext[];
  /** One line on why it works. */
  why: string;
}

/** Seed set — the Library page agent grows this toward the ~63-line target. */
export const LINES: LibraryLine[] = [
  {
    id: 'opener-specific-01',
    category: 'opener',
    tone: 'charming',
    text: 'That photo at [specific place] — what were you actually doing five minutes before it was taken?',
    principle: 'SPECIFICITY',
    citation: 'Aron et al., 1997',
    contexts: ['tinder', 'hinge'],
    why: 'A specific observation outperforms every generic opener; it proves attention.',
  },
  {
    id: 'banter-playful-01',
    category: 'banter',
    tone: 'playful',
    text: 'We agree on too much. Quick, name one controversial opinion so I can pretend to be outraged.',
    principle: 'PLAYFULNESS',
    citation: 'Hall, 2015',
    contexts: ['tinder', 'hinge', 'imessage'],
    why: 'Shared humor is one of the strongest predictors of romantic interest.',
  },
  {
    id: 'date-ask-direct-01',
    category: 'date-ask',
    tone: 'direct',
    text: 'I like this. Let’s do it in person — [activity], [day], [time]. If the week’s bad, name a day.',
    principle: 'MOMENTUM — THE CONCRETE ASK',
    contexts: ['tinder', 'hinge', 'imessage'],
    why: 'Concrete plans convert; vague "we should hang" threads die of drift.',
  },
  {
    id: 'exit-graceful-01',
    category: 'exit',
    tone: 'charming',
    text: 'No worries at all — I’ve enjoyed the chat. If life calms down and you want to pick it back up, you know where I am.',
    principle: 'GRACEFUL EXITS',
    contexts: ['tinder', 'hinge', 'imessage', 'instagram'],
    why: 'A warm, pressure-free exit preserves dignity — and occasionally the door.',
  },
  {
    id: 'revival-callback-01',
    category: 'revival',
    tone: 'playful',
    text: 'Walked past a [callback to her interest] today and thought of our debate. You were still wrong. How’s your week?',
    principle: 'THE CALLBACK',
    contexts: ['imessage', 'instagram'],
    why: 'A callback shows recall — total attention is the oldest seduction on record.',
  },
];

export function linesByCategory(category: LineCategory): LibraryLine[] {
  return LINES.filter((l) => l.category === category);
}

export function linesByTone(tone: Tone): LibraryLine[] {
  return LINES.filter((l) => l.tone === tone);
}
