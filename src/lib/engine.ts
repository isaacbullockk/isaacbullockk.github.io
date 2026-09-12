/**
 * Wingman conversation engine — shared foundation (design.md §8, copilot.md).
 *
 * The Co-Pilot page (/copilot) builds on this: paste a thread → stage
 * classification, interest score (0–100), signal list, coaching note, and
 * three toned reply suggestions. `rules` mode runs these heuristics locally;
 * `ai` mode (BYO API key, localStorage `wm:apikey`) may replace the analysis
 * but MUST keep the same result shape and the ethical spine: fading interest
 * triggers a graceful-exit suggestion, never a persistence script.
 */

/* ---------------------------------- types --------------------------------- */

export type ConversationStage = 'opener' | 'rapport' | 'building' | 'ask' | 'stalled';

export const STAGE_LABELS: Record<ConversationStage, string> = {
  opener: 'OPENER',
  rapport: 'RAPPORT',
  building: 'BUILDING',
  ask: 'THE ASK',
  stalled: 'STALLED',
};

export const STAGE_ORDER: ConversationStage[] = ['opener', 'rapport', 'building', 'ask', 'stalled'];

export type Tone = 'playful' | 'charming' | 'direct';

export const TONE_COLORS: Record<Tone, string> = {
  playful: '#D08C46', // amber
  charming: '#B4683B', // copper
  direct: '#9E4A38', // wine
};

export type ChatContext = 'tinder' | 'hinge' | 'imessage' | 'instagram' | 'other';

export interface ChatMessage {
  sender: 'her' | 'you';
  text: string;
  /** Optional timestamp (ms). Enables response-time heuristics. */
  at?: number;
}

export type SignalPolarity = 'positive' | 'negative' | 'neutral';

export interface Signal {
  /** Short mono-chip label, e.g. "ASKS QUESTIONS BACK". */
  label: string;
  polarity: SignalPolarity;
  /** Contribution to the interest score (signed, roughly -20..+20). */
  weight: number;
  /** The research principle the heuristic maps to, when relevant. */
  principle?: string;
}

export type InterestZone = 'cold' | 'warming' | 'hot';

export function interestZone(score: number): InterestZone {
  if (score < 35) return 'cold';
  if (score <= 65) return 'warming';
  return 'hot';
}

export const ZONE_LABELS: Record<InterestZone, string> = {
  cold: 'COLD < 35',
  warming: 'WARMING 35–65',
  hot: 'HOT > 65',
};

export interface Reply {
  tone: Tone;
  text: string;
  /** Mono chip, e.g. "MOMENTUM — THE CONCRETE ASK". */
  principle: string;
  why: string;
}

export interface AnalysisResult {
  stage: ConversationStage;
  /** 0–100 */
  interest: number;
  zone: InterestZone;
  signals: Signal[];
  coachingNote: string;
  replies: Reply[];
}

/* --------------------------- signal heuristics ---------------------------- */

const LAUGHTER = /\b(haha+|lol|lmao|hehe+)\b|😂|🤣/i;
const QUESTION = /\?/;
const EXCITEMENT = /!{1,}/;
const SHORT_ANSWER = /^(ok|okay|k|cool|nice|lol|yeah|yep|sure|hmm?)[.!]?$/i;

interface Rule {
  label: string;
  polarity: SignalPolarity;
  weight: number;
  principle?: string;
  test: (her: string[], you: string[]) => boolean;
}

/** Interest-signal heuristics — each maps to a principle in the Playbook. */
export const SIGNAL_RULES: Rule[] = [
  {
    label: 'LAUGHS AT YOUR JOKES',
    polarity: 'positive',
    weight: 12,
    principle: 'KNOWN LIKING',
    test: (her) => LAUGHTER.test(her.join(' ')),
  },
  {
    label: 'ASKS QUESTIONS BACK',
    polarity: 'positive',
    weight: 14,
    principle: 'RESPONSIVENESS',
    test: (her) => her.some((m) => QUESTION.test(m)),
  },
  {
    label: 'USES EXCITEMENT',
    polarity: 'positive',
    weight: 8,
    principle: 'PLAYFULNESS',
    test: (her) => her.some((m) => EXCITEMENT.test(m)),
  },
  {
    label: 'WRITES LONG MESSAGES',
    polarity: 'positive',
    weight: 10,
    principle: 'SELF-DISCLOSURE',
    test: (her) => {
      const avg = her.reduce((s, m) => s + m.length, 0) / Math.max(1, her.length);
      return avg > 80;
    },
  },
  {
    label: 'SHARES SPECIFICS',
    polarity: 'positive',
    weight: 10,
    principle: 'SPECIFICITY',
    test: (her) => her.some((m) => m.length > 120),
  },
  {
    label: 'MATCHES YOUR ENERGY',
    polarity: 'neutral',
    weight: 6,
    principle: 'MOMENTUM',
    test: (her, you) => {
      const len = (xs: string[]) => xs.reduce((s, m) => s + m.length, 0) / Math.max(1, xs.length);
      const ratio = len(her) / Math.max(1, len(you));
      return ratio > 0.6 && ratio < 1.8;
    },
  },
  {
    label: 'SHORT, LOW-EFFORT REPLIES',
    polarity: 'negative',
    weight: -14,
    principle: 'GRACEFUL EXITS',
    test: (her) => her.length > 0 && her.filter((m) => SHORT_ANSWER.test(m.trim())).length >= Math.ceil(her.length / 2),
  },
  {
    label: 'NO QUESTIONS BACK',
    polarity: 'negative',
    weight: -8,
    principle: 'RESPONSIVENESS',
    test: (her) => her.length >= 3 && !her.some((m) => QUESTION.test(m)),
  },
];

/* --------------------------- stage classification ------------------------- */

export function classifyStage(messages: ChatMessage[]): ConversationStage {
  if (messages.length === 0) return 'opener';
  const her = messages.filter((m) => m.sender === 'her');
  const total = messages.length;
  if (total <= 2) return 'opener';

  const recentHer = her.slice(-3).map((m) => m.text);
  const fading =
    her.length >= 3 &&
    recentHer.filter((t) => SHORT_ANSWER.test(t.trim())).length >= 2;
  if (fading) return 'stalled';

  const plans = /\b(date|drinks?|coffee|dinner|meet up|hang out|thursday|friday|saturday|tonight|tomorrow)\b/i;
  const lastFew = messages.slice(-4).map((m) => m.text).join(' ');
  if (plans.test(lastFew)) return 'ask';
  if (total >= 10) return 'building';
  return 'rapport';
}

/* ------------------------------ interest score ---------------------------- */

export function scoreInterest(messages: ChatMessage[]): { score: number; signals: Signal[] } {
  const her = messages.filter((m) => m.sender === 'her').map((m) => m.text);
  const you = messages.filter((m) => m.sender === 'you').map((m) => m.text);
  const signals: Signal[] = SIGNAL_RULES.filter((r) => r.test(her, you)).map(
    ({ label, polarity, weight, principle }) => ({ label, polarity, weight, principle }),
  );
  const raw = 50 + signals.reduce((s, sig) => s + sig.weight, 0);
  const score = Math.max(2, Math.min(98, Math.round(raw)));
  return { score, signals };
}

/* ------------------------------- coaching --------------------------------- */

export function coachingNoteFor(stage: ConversationStage, zone: InterestZone): string {
  if (stage === 'stalled' || zone === 'cold') {
    return 'Interest is fading. One light callback at most — then coach the graceful exit, not the second siege.';
  }
  switch (stage) {
    case 'opener':
      return 'Open with something specific from her profile. Specific beats clever every time.';
    case 'rapport':
      return 'She is responding. Trade real details — reciprocity of disclosure builds closeness.';
    case 'building':
      return 'Momentum is yours. Escalate the playfulness and start seeding a concrete plan.';
    case 'ask':
      return 'The window is open. Make the ask concrete: activity, day, time. Vague invites die.';
  }
}

/* --------------------------- rules-mode analysis -------------------------- */

/**
 * Local rules-mode analysis. Reply suggestion text is intentionally left to
 * the lines library / AI layer — the Co-Pilot page composes `AnalysisResult`
 * from these primitives plus `src/lib/lines.ts`.
 */
export function analyzeConversation(messages: ChatMessage[]): Omit<AnalysisResult, 'replies'> {
  const stage = classifyStage(messages);
  const { score, signals } = scoreInterest(messages);
  const zone = interestZone(score);
  return {
    stage,
    interest: score,
    zone,
    signals,
    coachingNote: coachingNoteFor(stage, zone),
  };
}

/* ------------------------------ persistence ------------------------------- */

export const STORAGE_KEYS = {
  convos: 'wm:convos',
  favs: 'wm:favs',
  apikey: 'wm:apikey',
  endpoint: 'wm:endpoint',
  model: 'wm:model',
  mode: 'wm:mode', // 'rules' | 'ai'
} as const;

export type EngineMode = 'rules' | 'ai';
