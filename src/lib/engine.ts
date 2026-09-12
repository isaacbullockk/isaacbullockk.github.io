/**
 * Wingman conversation engine — shared foundation (design.md §8, copilot.md).
 *
 * The Co-Pilot page (/copilot) builds on this: paste a thread → stage
 * classification, interest score (0–100), signal list, coaching note, and
 * three toned reply suggestions. `rules` mode runs these heuristics locally;
 * `ai` mode (BYO API key, localStorage `wm:apikey`) calls an OpenAI-compatible
 * endpoint client-side with the same result shape and the same ethical spine:
 * fading interest triggers a graceful-exit suggestion, never a persistence
 * script.
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

export const STAGE_DESCRIPTIONS: Record<ConversationStage, string> = {
  opener: 'First contact — one specific observation beats a hundred clever lines.',
  rapport: 'Warming up — trading details, testing the rhythm of the exchange.',
  building: 'Investment phase — responsiveness, callbacks, and seeded date ideas.',
  ask: 'The window is open — make the plan concrete: activity, day, time.',
  stalled: 'Momentum lost — one honest revival attempt, then exit with grace.',
};

export type Tone = 'playful' | 'charming' | 'direct';
export type ReplyTone = Tone | 'revival' | 'exit';

export const TONE_COLORS: Record<Tone, string> = {
  playful: '#D08C46', // amber
  charming: '#B4683B', // copper
  direct: '#9E4A38', // wine
};

export const REPLY_TONE_COLORS: Record<ReplyTone, string> = {
  ...TONE_COLORS,
  revival: '#D08C46', // amber family — a light pattern-interrupt
  exit: '#B4683B', // copper — warm, dignified sign-off
};

export const TONE_LABELS: Record<ReplyTone, string> = {
  playful: 'PLAYFUL',
  charming: 'CHARMING',
  direct: 'DIRECT',
  revival: 'REVIVAL',
  exit: 'EXIT',
};

/** The default principle tag behind each tone (research attribution). */
export const TONE_PRINCIPLES: Record<Tone, string> = {
  playful: 'HUMOR & PLAYFULNESS (HALL)',
  charming: 'RESPONSIVENESS & SPECIFICITY (ARON · BIRNBAUM & REIS)',
  direct: 'MOMENTUM — THE CONCRETE ASK',
};

export type ChatContext =
  | 'tinder'
  | 'bumble'
  | 'hinge'
  | 'texting'
  | 'imessage'
  | 'instagram'
  | 'other';

export const CONTEXT_CHIPS: { id: ChatContext; label: string }[] = [
  { id: 'tinder', label: 'TINDER' },
  { id: 'bumble', label: 'BUMBLE' },
  { id: 'hinge', label: 'HINGE' },
  { id: 'texting', label: 'TEXTING' },
  { id: 'instagram', label: 'INSTAGRAM' },
];

export interface ChatMessage {
  sender: 'her' | 'you';
  text: string;
  /** Optional timestamp (ms, relative ok). Enables response-time heuristics. */
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
  tone: ReplyTone;
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
  /** Strong negative pattern — one-word answers + no questions back. */
  fading: boolean;
  /** Fraunces italic one-liner next to the meter. */
  verdict: string;
  coachingNote: string;
  /** Mono attribution under the coaching note, e.g. "— MOMENTUM & THE CONCRETE ASK". */
  coachingSource: string;
  replies: Reply[];
}

/* ------------------------------ thread parsing ----------------------------- */

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const TIME_TOKEN = /\b(\d{1,2}):(\d{2})\s*([aApP][mM])?\b/;

/**
 * Parse a pasted thread into messages. Prefixed lines ("HER:", "ME:", her
 * name) are honored; unprefixed lines alternate senders (starting with her),
 * which matches how most people paste a chat export. Lines containing a
 * clock token (e.g. "21:42" or "9:15 pm") feed the response-time heuristics.
 */
export function parseThread(raw: string, herName?: string): ChatMessage[] {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const nameAlt = herName && herName.trim() ? `|${escapeRegExp(herName.trim())}` : '';
  const herRe = new RegExp(`^(her|she|them${nameAlt})\\s*[:\\-—]\\s*`, 'i');
  const meRe = /^(me|you|i)\s*[:\-—]\s*/i;

  const out: ChatMessage[] = [];
  let lastSender: 'her' | 'you' = 'you'; // first unprefixed line becomes "her"
  let prevMinutes = -1;
  let dayOffset = 0;

  for (const line of lines) {
    let sender: 'her' | 'you' | null = null;
    let text = line;
    if (herRe.test(line)) {
      sender = 'her';
      text = line.replace(herRe, '');
    } else if (meRe.test(line)) {
      sender = 'you';
      text = line.replace(meRe, '');
    }

    // Extract a clock token, if any, as a relative timestamp.
    let at: number | undefined;
    const tm = text.match(TIME_TOKEN);
    if (tm) {
      let h = parseInt(tm[1], 10);
      const m = parseInt(tm[2], 10);
      if (tm[3]) {
        const pm = tm[3].toLowerCase() === 'pm';
        if (pm && h < 12) h += 12;
        if (!pm && h === 12) h = 0;
      }
      const mins = h * 60 + m;
      if (prevMinutes >= 0 && mins < prevMinutes) dayOffset += 24 * 60;
      prevMinutes = mins;
      at = (dayOffset + mins) * 60 * 1000;
      text = text.replace(TIME_TOKEN, '').replace(/[[\]()]/g, '').trim();
    }

    if (!text) continue;
    if (!sender) {
      sender = lastSender === 'you' ? 'her' : 'you';
    }
    lastSender = sender;
    out.push({ sender, text, at });
  }
  return out;
}

/* --------------------------- signal heuristics ---------------------------- */

const LAUGHTER = /\b(haha+|lol|lmao|hehe+)\b|[😂🤣]/i;
const QUESTION = /\?/;
const EXCITEMENT = /!{1,}/;
const SHORT_ANSWER = /^(ok|okay|k|cool|nice|lol|yeah|yep|yes|no|sure|hmm?|true|right|bet|word|idk|maybe|np|thx|thanks|lol\.?)[.!]?$/i;

export interface ThreadStats {
  herMsgs: ChatMessage[];
  youMsgs: ChatMessage[];
  herQuestionCount: number;
  avgHer: number;
  avgYou: number;
}

export function threadStats(messages: ChatMessage[]): ThreadStats {
  const herMsgs = messages.filter((m) => m.sender === 'her');
  const youMsgs = messages.filter((m) => m.sender === 'you');
  const avg = (xs: ChatMessage[]) =>
    xs.reduce((s, m) => s + m.text.length, 0) / Math.max(1, xs.length);
  return {
    herMsgs,
    youMsgs,
    herQuestionCount: herMsgs.filter((m) => QUESTION.test(m.text)).length,
    avgHer: avg(herMsgs),
    avgYou: avg(youMsgs),
  };
}

/** Interest-signal heuristics — each maps to a principle in the Playbook. */
export function detectSignals(messages: ChatMessage[]): Signal[] {
  const { herMsgs, youMsgs, herQuestionCount, avgHer, avgYou } = threadStats(messages);
  const her = herMsgs.map((m) => m.text);
  const you = youMsgs.map((m) => m.text);
  const signals: Signal[] = [];
  const push = (
    label: string,
    polarity: SignalPolarity,
    weight: number,
    principle?: string,
  ) => signals.push({ label, polarity, weight, principle });

  if (herMsgs.length === 0) return signals;

  /* ---- positive ---- */
  if (LAUGHTER.test(her.join(' '))) {
    push('LAUGHS AT YOUR JOKES', 'positive', 12, 'KNOWN LIKING');
  }
  if (herQuestionCount >= 2) {
    push(`QUESTIONS BACK ×${herQuestionCount}`, 'positive', 14, 'RESPONSIVENESS');
  } else if (herQuestionCount === 1) {
    push('ASKS A QUESTION BACK', 'positive', 9, 'RESPONSIVENESS');
  }
  if (her.some((m) => EXCITEMENT.test(m))) {
    push('USES EXCITEMENT', 'positive', 8, 'PLAYFULNESS');
  }
  if (avgHer > 80) {
    push('WRITES LONG MESSAGES', 'positive', 10, 'SELF-DISCLOSURE');
  }
  if (avgHer > avgYou && you.length > 0) {
    push('MESSAGES LONGER THAN YOURS', 'positive', 10, 'INVESTMENT');
  }
  if (her.some((m) => m.length > 120)) {
    push('SHARES SPECIFICS', 'positive', 10, 'SPECIFICITY');
  }
  // Unprompted personal info: a substantive her-message that follows one of
  // yours which asked nothing — she volunteered it.
  const unprompted = messages.some(
    (m, i) =>
      m.sender === 'her' &&
      i > 0 &&
      messages[i - 1].sender === 'you' &&
      !QUESTION.test(messages[i - 1].text) &&
      m.text.length >= 60,
  );
  if (unprompted) {
    push('UNPROMPTED PERSONAL INFO', 'positive', 9, 'SELF-DISCLOSURE');
  }
  // Fast replies (timestamps only).
  const fastReply = messages.some(
    (m, i) =>
      m.sender === 'her' &&
      m.at !== undefined &&
      i > 0 &&
      messages[i - 1].sender === 'you' &&
      messages[i - 1].at !== undefined &&
      (m.at as number) - (messages[i - 1].at as number) >= 0 &&
      (m.at as number) - (messages[i - 1].at as number) <= 15 * 60 * 1000,
  );
  if (fastReply) {
    push('FAST REPLIES', 'positive', 8, 'RESPONSIVENESS');
  }
  const ratio = avgHer / Math.max(1, avgYou);
  if (you.length > 0 && ratio > 0.6 && ratio < 1.8) {
    push('MATCHES YOUR ENERGY', 'neutral', 6, 'MOMENTUM');
  }

  /* ---- negative ---- */
  const shortCount = her.filter((m) => SHORT_ANSWER.test(m.trim())).length;
  const lowEffort = her.length > 0 && shortCount >= Math.ceil(her.length / 2);
  if (lowEffort) {
    push('SHORT, LOW-EFFORT REPLIES', 'negative', -14, 'GRACEFUL EXITS');
  }
  const noQuestions = her.length >= 3 && herQuestionCount === 0;
  if (noQuestions) {
    push('NO QUESTIONS BACK', 'negative', -8, 'RESPONSIVENESS');
  }
  if (her.length >= 3 && !her.some((m) => m.length > 60) && herQuestionCount === 0) {
    push('NO NEW TOPIC FROM HER', 'negative', -8, 'MOMENTUM');
  }
  // Long gap before her last reply (timestamps only).
  const lastHerIdx = messages.map((m, i) => (m.sender === 'her' ? i : -1)).filter((i) => i >= 0).pop();
  if (lastHerIdx !== undefined && lastHerIdx > 0) {
    const cur = messages[lastHerIdx];
    const prev = messages[lastHerIdx - 1];
    if (cur.at !== undefined && prev.at !== undefined) {
      const gap = (cur.at as number) - (prev.at as number);
      if (gap >= 12 * 60 * 60 * 1000) {
        push('12H GAP BEFORE LAST REPLY', 'negative', -12, 'MOMENTUM');
      }
    }
  }

  return signals;
}

/** Strong negative pattern: one-word answers + zero questions back. */
export function isFading(messages: ChatMessage[], signals: Signal[]): boolean {
  const hasShort = signals.some((s) => s.label === 'SHORT, LOW-EFFORT REPLIES');
  const hasNoQ = signals.some((s) => s.label === 'NO QUESTIONS BACK');
  if (hasShort && hasNoQ) return true;
  const her = messages.filter((m) => m.sender === 'her').slice(-3);
  return (
    her.length >= 2 && her.filter((m) => SHORT_ANSWER.test(m.text.trim())).length >= 2
  );
}

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

  // A very long silence before the most recent message also reads as stalled.
  const timed = messages.filter((m) => m.at !== undefined);
  if (timed.length >= 2) {
    const lastTwo = timed.slice(-2);
    const gap = (lastTwo[1].at as number) - (lastTwo[0].at as number);
    if (gap >= 48 * 60 * 60 * 1000 && her.length >= 2) return 'stalled';
  }

  const plans =
    /\b(date|drinks?|coffee|dinner|meet up|hang out|monday|tuesday|wednesday|thursday|friday|saturday|sunday|tonight|tomorrow|this week|weekend)\b/i;
  const lastFew = messages.slice(-4).map((m) => m.text).join(' ');
  if (plans.test(lastFew)) return 'ask';
  if (total >= 10) return 'building';
  return 'rapport';
}

/* ------------------------------ interest score ---------------------------- */

export function scoreInterest(messages: ChatMessage[]): { score: number; signals: Signal[] } {
  const signals = detectSignals(messages);
  const raw = 50 + signals.reduce((s, sig) => s + sig.weight, 0);
  const score = Math.max(2, Math.min(98, Math.round(raw)));
  return { score, signals };
}

/* ------------------------------- verdicts --------------------------------- */

export function verdictFor(zone: InterestZone): string {
  switch (zone) {
    case 'hot':
      return 'She’s investing. Long replies, questions back, laughing. This is the moment.';
    case 'warming':
      return 'Real signals, still gathering. Match her energy and give her something to react to.';
    case 'cold':
      return 'The energy is thin here. One honest swing — then protect your dignity and hers.';
  }
}

/* ------------------------------- coaching --------------------------------- */

export interface Coaching {
  note: string;
  source: string;
}

export function coachingFor(
  stage: ConversationStage,
  zone: InterestZone,
  fading: boolean,
): Coaching {
  if (stage === 'stalled' || fading || zone === 'cold') {
    return {
      note: 'She’s cooling. Send one light callback — if it lands flat, exit warm and tall. Persistence reads as pressure; composure is the attractive move.',
      source: '— GRACEFUL EXITS',
    };
  }
  switch (stage) {
    case 'opener':
      return {
        note: 'Open on something specific from her world. Specific beats clever every time — it proves you actually paid attention.',
        source: '— SPECIFICITY (ARON ET AL., 1997)',
      };
    case 'rapport':
      return {
        note: 'She’s responding. Trade real details and give her questions actual substance — reciprocal disclosure is how closeness compounds.',
        source: '— RECIPROCAL SELF-DISCLOSURE',
      };
    case 'building':
      return zone === 'hot'
        ? {
            note: 'You’re at the banter peak. Move to a concrete, time-boxed ask within your next two messages — momentum decays fast from here.',
            source: '— MOMENTUM & THE CONCRETE ASK',
          }
        : {
            note: 'Momentum is yours. Keep the playfulness alive and seed one concrete plan — then watch whether she picks it up.',
            source: '— MOMENTUM',
          };
    case 'ask':
      return {
        note: 'The window is open. Make the ask concrete: activity, day, time. Vague invites die of drift.',
        source: '— MOMENTUM & THE CONCRETE ASK',
      };
  }
}

export function coachingNoteFor(stage: ConversationStage, zone: InterestZone): string {
  return coachingFor(stage, zone, false).note;
}

/* --------------------------- callback extraction -------------------------- */

const TOPIC_KEYWORDS = [
  'ramen', 'pasta', 'carbonara', 'pizza', 'sushi', 'tacos', 'coffee', 'espresso',
  'wine', 'whiskey', 'negroni', 'cocktail', 'beer', 'brunch', 'dinner', 'cooking',
  'baking', 'hiking', 'climbing', 'running', 'yoga', 'tennis', 'surf', 'ski',
  'pottery', 'painting', 'museum', 'gallery', 'concert', 'jazz', 'vinyl', 'film',
  'movie', 'book', 'novel', 'dog', 'cat', 'travel', 'paris', 'italy', 'japan',
  'photography', 'guitar', 'piano', 'chess', 'garden', 'camping',
];

const STOPWORDS = new Set([
  'about', 'there', 'would', 'could', 'should', 'really', 'because', 'people',
  'thing', 'things', 'that', 'this', 'with', 'have', 'just', 'like', 'your',
  'youre', 'youve', 'actually', 'going', 'where', 'when', 'what', 'them',
]);

/** Pull a conversational hook from her messages for name/topic specificity. */
export function extractCallback(messages: ChatMessage[]): string | null {
  const herText = messages
    .filter((m) => m.sender === 'her')
    .map((m) => m.text)
    .join(' ')
    .toLowerCase();
  for (const kw of TOPIC_KEYWORDS) {
    if (herText.includes(kw)) return kw;
  }
  // Fallback: longest interesting word from her last two messages.
  const recent = messages
    .filter((m) => m.sender === 'her')
    .slice(-2)
    .map((m) => m.text)
    .join(' ');
  const words = recent
    .replace(/[^a-zA-Z'\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 7 && !STOPWORDS.has(w.toLowerCase()))
    .sort((a, b) => b.length - a.length);
  return words[0] ? words[0].toLowerCase() : null;
}

function activityFor(callback: string | null): string {
  if (!callback) return 'coffee or a walk';
  if (['coffee', 'espresso', 'brunch'].includes(callback)) return 'coffee';
  if (['wine', 'whiskey', 'negroni', 'cocktail', 'beer'].includes(callback)) return 'drinks';
  if (
    ['ramen', 'pasta', 'carbonara', 'pizza', 'sushi', 'tacos', 'dinner', 'cooking', 'baking'].includes(callback)
  )
    return 'dinner';
  if (['hiking', 'climbing', 'running', 'surf', 'ski', 'camping'].includes(callback))
    return 'that hike you mentioned';
  if (['museum', 'gallery', 'painting', 'pottery'].includes(callback))
    return 'that exhibit you mentioned';
  if (['concert', 'jazz', 'vinyl'].includes(callback)) return 'that show you mentioned';
  return 'coffee';
}

/* --------------------------- suggestion templates -------------------------- */

export interface SuggestInput {
  stage: ConversationStage;
  zone: InterestZone;
  signals: Signal[];
  messages: ChatMessage[];
  context: ChatContext;
  herName?: string;
  /** Bump to shuffle template variants (rules mode "SHUFFLE VARIANTS"). */
  seed?: number;
}

interface SugCtx {
  name: string; // her name, or "" — templates must read well either way
  named: string; // ", {name}" or ""
  callback: string; // topic hook, or "that"
  activity: string;
  trigger: string; // one-line description of the signal that fired
}

function buildSugCtx(input: SuggestInput): SugCtx {
  const name = (input.herName ?? '').trim();
  const cb = extractCallback(input.messages);
  const positives = input.signals.filter((s) => s.polarity === 'positive');
  const trigger =
    positives.length > 0
      ? `Her side shows ${positives
          .slice(0, 2)
          .map((s) => s.label.toLowerCase())
          .join(' and ')} — play directly into it.`
      : 'No strong green signals yet, so this line is built to give her something easy and specific to react to.';
  return {
    name,
    named: name ? `, ${name}` : '',
    callback: cb ?? 'that',
    activity: activityFor(cb),
    trigger,
  };
}

type StageGroup = 'opener' | 'rapport' | 'building' | 'ask';

function stageGroup(stage: ConversationStage): StageGroup {
  if (stage === 'stalled') return 'building';
  return stage;
}

interface Template {
  text: (c: SugCtx) => string;
  principle: string;
  why: (c: SugCtx) => string;
}

const BANK: Record<StageGroup, Record<Tone, Template[]>> = {
  opener: {
    playful: [
      {
        text: () =>
          'Important question before this goes any further: what’s your most indefensible food opinion? I need to know what I’m dealing with.',
        principle: TONE_PRINCIPLES.playful,
        why: (c) =>
          `A playful, low-stakes challenge invites a reply without demanding one. ${c.trigger}`,
      },
      {
        text: () =>
          'On a scale of 1 to “reorganizing the spice rack at midnight”, how chaotic is your week looking?',
        principle: TONE_PRINCIPLES.playful,
        why: (c) =>
          `Absurd scales are easy to answer and easy to riff on — humor is one of the strongest predictors of mutual interest (Hall). ${c.trigger}`,
      },
    ],
    charming: [
      {
        text: (c) =>
          `The ${c.callback} detail stopped me mid-scroll — there’s clearly a story there. What’s the short version?`,
        principle: TONE_PRINCIPLES.charming,
        why: (c) =>
          `Specificity proves attention, and attention is what responsiveness research keeps rewarding. ${c.trigger}`,
      },
      {
        text: (c) =>
          `You seem like someone with opinions about ${c.callback}. I’d like to hear the strongest one.`,
        principle: TONE_PRINCIPLES.charming,
        why: (c) =>
          `Asking about her world signals genuine curiosity — the Aron work shows mutual disclosure builds closeness fast. ${c.trigger}`,
      },
    ],
    direct: [
      {
        text: (c) =>
          `You seem interesting and I trust my read. Two options: we trade three honest questions here, or I take you for ${c.activity} this week.`,
        principle: TONE_PRINCIPLES.direct,
        why: (c) =>
          `Confidence plus a real choice — she can opt into either path with zero pressure. ${c.trigger}`,
      },
      {
        text: () =>
          'Skipping the small talk: what’s something you loved doing this month that you’d do again tomorrow?',
        principle: TONE_PRINCIPLES.direct,
        why: (c) =>
          `Direct doesn’t mean pushy — one sincere, specific question beats a week of “hey”. ${c.trigger}`,
      },
    ],
  },
  rapport: {
    playful: [
      {
        text: (c) =>
          `Careful${c.named} — you’re dangerously close to becoming my favorite notification. What’s the latest on ${c.callback}?`,
        principle: TONE_PRINCIPLES.playful,
        why: (c) =>
          `Light teasing plus a thread to pull on. ${c.trigger}`,
      },
      {
        text: (c) =>
          `We can’t keep agreeing like this, people will talk. Quick: defend your ${c.callback} position in exactly one sentence.`,
        principle: TONE_PRINCIPLES.playful,
        why: (c) =>
          `A mock challenge keeps the banter alive and gives her the floor. ${c.trigger}`,
      },
    ],
    charming: [
      {
        text: (c) =>
          `You mentioned ${c.callback} and I actually want the whole story — how did that start?`,
        principle: TONE_PRINCIPLES.charming,
        why: (c) =>
          `Follow-up questions are the single most replicated likeability finding in the speed-dating literature. ${c.trigger}`,
      },
      {
        text: (c) =>
          `I like how your brain works. What does a perfect slow Sunday look like for you${c.named}?`,
        principle: TONE_PRINCIPLES.charming,
        why: (c) =>
          `A sincere compliment plus an easy disclosure prompt — reciprocity does the rest. ${c.trigger}`,
      },
    ],
    direct: [
      {
        text: (c) =>
          `Not to rush a good thing, but threads like this are better in person. ${capitalize(c.activity)} this week — yes, or genuinely-not-now? Both are fine answers.`,
        principle: TONE_PRINCIPLES.direct,
        why: (c) =>
          `An honest ask with an explicit, pressure-free out. Consent-forward converts better than vague drift. ${c.trigger}`,
      },
      {
        text: () =>
          'I’m enjoying this. What are the odds you’re free for a quick drink this week — and be honest, I can take it.',
        principle: TONE_PRINCIPLES.direct,
        why: (c) =>
          `Direct interest, stated once, with dignity on both sides of the answer. ${c.trigger}`,
      },
    ],
  },
  building: {
    playful: [
      {
        text: (c) =>
          `I’m not saying our ${c.callback} debate is the highlight of my week, but I’ve told two people about it. You’re still wrong, by the way.`,
        principle: TONE_PRINCIPLES.playful,
        why: (c) =>
          `A callback proves you were listening — known-liking effects are among the strongest in attraction research. ${c.trigger}`,
      },
      {
        text: (c) =>
          `Update: I’ve decided you’re trouble — the charming kind. Anyway, I found the place that settles our ${c.callback} argument.`,
        principle: TONE_PRINCIPLES.playful,
        why: (c) =>
          `Playful framing plus a seeded plan — the natural bridge from banter to the ask. ${c.trigger}`,
      },
    ],
    charming: [
      {
        text: (c) =>
          `I keep thinking about what you said about ${c.callback}. Most people skim that topic — you didn’t. Tell me more${c.named}.`,
        principle: TONE_PRINCIPLES.charming,
        why: (c) =>
          `Responsiveness — showing her words actually landed — is what Birnbaum & Reis tie to desire. ${c.trigger}`,
      },
      {
        text: () =>
          'Full honesty: this is the best conversation I’ve had on here in a while. What’s something you’ve been looking forward to?',
        principle: TONE_PRINCIPLES.charming,
        why: (c) =>
          `Stating genuine interest clearly (without demand) outperforms aloofness in the research. ${c.trigger}`,
      },
    ],
    direct: [
      {
        text: (c) =>
          `I’ll skip the dance: I like talking to you. ${capitalize(c.activity)} this week — Thursday or Saturday? If neither works, name a day.`,
        principle: TONE_PRINCIPLES.direct,
        why: (c) =>
          `Concrete plans convert; “we should hang sometime” dies of drift. ${c.trigger}`,
      },
      {
        text: (c) =>
          `This deserves to continue in person. ${capitalize(c.activity)} — pick a day this week and I’ll handle the rest.`,
        principle: TONE_PRINCIPLES.direct,
        why: (c) =>
          `Decisive, specific, and leaves her full control of the yes. ${c.trigger}`,
      },
    ],
  },
  ask: {
    playful: [
      {
        text: (c) =>
          `This banter has officially outgrown the app. ${capitalize(c.activity)}, this week — I’ll bring my A-game, you bring the ${c.callback} hot takes.`,
        principle: TONE_PRINCIPLES.playful,
        why: (c) =>
          `The window is open; a playful frame keeps the ask light while still being concrete. ${c.trigger}`,
      },
      {
        text: (c) =>
          `Okay, enough flirting by text — I refuse to lose this ${c.callback} argument without witnesses. When are you free this week?`,
        principle: TONE_PRINCIPLES.playful,
        why: (c) =>
          `Momentum is highest right now; humor lowers the stakes of saying yes. ${c.trigger}`,
      },
    ],
    charming: [
      {
        text: (c) =>
          `I’ve genuinely enjoyed this${c.named}. Let’s continue it over ${c.activity} — are you more of a weeknight or weekend person?`,
        principle: TONE_PRINCIPLES.charming,
        why: (c) =>
          `Warm sincerity plus a low-friction scheduling question — easy to answer honestly. ${c.trigger}`,
      },
      {
        text: (c) =>
          `I know a place that matches your ${c.callback} energy. Let me take you — what does your week look like?`,
        principle: TONE_PRINCIPLES.charming,
        why: (c) =>
          `Specificity about the plan shows the attention that responsiveness research rewards. ${c.trigger}`,
      },
    ],
    direct: [
      {
        text: (c) =>
          `Let’s lock it in: ${c.activity}, Thursday, 7pm. If Thursday’s bad, give me a day and I’ll make it work.`,
        principle: TONE_PRINCIPLES.direct,
        why: (c) =>
          `Maximum clarity at peak momentum — activity, day, time, and an easy way to counter. ${c.trigger}`,
      },
      {
        text: (c) =>
          `Final answer time: ${c.activity} this week, yes or yes-with-a-different-day?`,
        principle: TONE_PRINCIPLES.direct,
        why: (c) =>
          `Playful confidence, but the choice is entirely hers — that balance is the whole game. ${c.trigger}`,
      },
    ],
  },
};

const REVIVAL_TEMPLATES: Template[] = [
  {
    text: (c) =>
      `Walked past a ${c.callback} place today and heard your argument in my head. You were still wrong. Hope your week’s treating you well.`,
    principle: 'THE CALLBACK — PATTERN INTERRUPT',
    why: (c) =>
      `One light, zero-demand message that proves attention without asking for anything. If it lands flat, that’s your answer. ${c.trigger}`,
  },
  {
    text: (c) =>
      `Quick callback: I finally looked into ${c.callback}. Verdict — you may have had a point. That’s all the admission you get.`,
    principle: 'THE CALLBACK — PATTERN INTERRUPT',
    why: (c) =>
      `A revival gets exactly one swing. This one is warm, specific, and carries no pressure to reply. ${c.trigger}`,
  },
];

const EXIT_TEMPLATES: Template[] = [
  {
    text: (c) =>
      `No pressure at all${c.named} — I’ve enjoyed our chat, and life gets busy. If you ever want to pick it back up, you know where to find me.`,
    principle: 'GRACEFUL EXITS',
    why: (c) =>
      `A warm, pressure-free exit protects your dignity and hers — and occasionally leaves the door open. ${c.trigger}`,
  },
  {
    text: () =>
      'Seems like timing isn’t on our side, and that’s okay. Thanks for the laughs — wishing you a genuinely good season.',
    principle: 'GRACEFUL EXITS',
    why: (c) =>
      `Fading interest is a clear no’s quieter cousin. The research is unambiguous: pressure backfires, grace endures. ${c.trigger}`,
  },
];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

/** Compose the three (or four, when stalled) toned reply suggestions. */
export function suggestReplies(input: SuggestInput): Reply[] {
  const c = buildSugCtx(input);
  const seed = input.seed ?? 0;
  const toReply = (tone: ReplyTone, t: Template): Reply => ({
    tone,
    text: t.text(c),
    principle: t.principle,
    why: t.why(c),
  });

  if (input.stage === 'stalled' || input.zone === 'cold') {
    const g = stageGroup(input.stage);
    return [
      toReply('playful', pick(BANK[g].playful, seed)),
      toReply('charming', pick(BANK[g].charming, seed)),
      toReply('revival', pick(REVIVAL_TEMPLATES, seed)),
      toReply('exit', pick(EXIT_TEMPLATES, seed)),
    ];
  }

  const g = stageGroup(input.stage);
  return [
    toReply('playful', pick(BANK[g].playful, seed)),
    toReply('charming', pick(BANK[g].charming, seed)),
    toReply('direct', pick(BANK[g].direct, seed)),
  ];
}

/* --------------------------- rules-mode analysis -------------------------- */

/** Local rules-mode analysis over already-parsed messages (no replies). */
export function analyzeConversation(
  messages: ChatMessage[],
): Omit<AnalysisResult, 'replies'> {
  const stage = classifyStage(messages);
  const { score, signals } = scoreInterest(messages);
  const zone = interestZone(score);
  const fading = isFading(messages, signals);
  const coaching = coachingFor(stage, zone, fading);
  return {
    stage,
    interest: score,
    zone,
    signals,
    fading,
    verdict: verdictFor(zone),
    coachingNote: coaching.note,
    coachingSource: coaching.source,
  };
}

/** Full rules-mode pipeline: raw pasted text → complete AnalysisResult. */
export function runRulesAnalysis(
  raw: string,
  context: ChatContext,
  herName?: string,
  seed = 0,
): AnalysisResult {
  const messages = parseThread(raw, herName);
  const base = analyzeConversation(messages);
  const replies = suggestReplies({
    stage: base.stage,
    zone: base.zone,
    signals: base.signals,
    messages,
    context,
    herName,
    seed,
  });
  return { ...base, replies };
}

/* -------------------------------- AI mode ---------------------------------- */

export interface AISettings {
  endpoint: string;
  apiKey: string;
  model: string;
}

export const DEFAULT_ENDPOINT = 'https://api.openai.com/v1';
export const DEFAULT_MODEL = 'gpt-4o-mini';

const AI_SYSTEM_PROMPT = `You are Wingman, a research-based dating conversation coach. You coach consent-forward, research-backed flirting — never manipulation.

HARD RULES (ethics guardrails — never break these):
- No negging, no pressure, no deception, no manufactured scarcity, no "games".
- Direct means honest and warm, never pushy. Every ask must leave her a comfortable out.
- If her interest is fading (short low-effort replies, long silences, no questions back), recommend ONE light revival attempt at most, then a graceful, warm exit. NEVER write a persistence script.
- Compliments must be specific and sincere, never about her body.

You analyze a pasted conversation and reply with STRICT JSON ONLY (no markdown, no commentary) in exactly this shape:
{
  "stage": "opener" | "rapport" | "building" | "ask" | "stalled",
  "interest": <integer 2-98, your read of HER interest level>,
  "signals": [{"label": "SHORT UPPERCASE LABEL", "polarity": "positive" | "negative" | "neutral"}],
  "verdict": "<one sentence, present tense, honest read of the moment>",
  "coachingNote": "<the single most important next-move advice, 1-2 sentences>",
  "coachingSource": "<short uppercase attribution, e.g. '— MOMENTUM & THE CONCRETE ASK'>",
  "replies": [
    {"tone": "playful", "text": "<reply he could send>", "principle": "HUMOR & PLAYFULNESS (HALL)", "why": "<2-3 sentences: cite the principle and the signal in HER messages that triggered it>"},
    {"tone": "charming", "text": "...", "principle": "RESPONSIVENESS & SPECIFICITY (ARON · BIRNBAUM & REIS)", "why": "..."},
    {"tone": "direct", "text": "...", "principle": "MOMENTUM — THE CONCRETE ASK", "why": "..."}
  ]
}
If (and only if) the stage is "stalled" or interest is below 35, REPLACE the "direct" reply with two replies: {"tone": "revival", ...} (one pattern-interrupt/callback line) and {"tone": "exit", ...} (a graceful, warm sign-off). So replies then has 4 entries.
Replies must sound like a real human text message — casual, warm, specific to details in the thread. Use her name if one is provided. Keep each reply under 45 words.`;

const REPLY_TONES: ReplyTone[] = ['playful', 'charming', 'direct', 'revival', 'exit'];

function formatTranscript(messages: ChatMessage[]): string {
  return messages
    .map((m) => `${m.sender === 'her' ? 'HER' : 'ME'}: ${m.text}`)
    .join('\n');
}

/**
 * AI-mode analysis: calls an OpenAI-compatible chat-completions endpoint
 * directly from the browser. Throws on network/parse/validation errors —
 * the caller falls back to rules mode.
 */
export async function runAIAnalysis(
  messages: ChatMessage[],
  context: ChatContext,
  herName: string | undefined,
  settings: AISettings,
): Promise<AnalysisResult> {
  if (messages.length === 0) throw new Error('Nothing to analyze');
  const endpoint = (settings.endpoint || DEFAULT_ENDPOINT).replace(/\/+$/, '');
  const userPrompt = [
    `Context: ${context}.`,
    herName ? `Her name: ${herName}.` : 'Her name is unknown — do not invent one.',
    '',
    'CONVERSATION:',
    formatTranscript(messages),
  ].join('\n');

  const res = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model || DEFAULT_MODEL,
      temperature: 0.8,
      messages: [
        { role: 'system', content: AI_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Endpoint returned ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from endpoint');

  const cleaned = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Response was not JSON');
    parsed = JSON.parse(m[0]);
  }

  const p = parsed as Record<string, unknown>;
  const stageRaw = String(p.stage ?? '').toLowerCase();
  const stage = (STAGE_ORDER as string[]).includes(stageRaw)
    ? (stageRaw as ConversationStage)
    : 'rapport';
  const interest = Math.max(2, Math.min(98, Math.round(Number(p.interest) || 50)));
  const zone = interestZone(interest);

  const signals: Signal[] = Array.isArray(p.signals)
    ? (p.signals as Record<string, unknown>[]).slice(0, 8).map((s) => {
        const pol = String(s.polarity ?? 'neutral');
        return {
          label: String(s.label ?? 'SIGNAL').toUpperCase().slice(0, 42),
          polarity: (['positive', 'negative', 'neutral'].includes(pol)
            ? pol
            : 'neutral') as SignalPolarity,
          weight: 0,
        };
      })
    : [];

  const replies: Reply[] = Array.isArray(p.replies)
    ? (p.replies as Record<string, unknown>[])
        .filter((r) => REPLY_TONES.includes(String(r.tone) as ReplyTone) && typeof r.text === 'string' && r.text.length > 0)
        .slice(0, 4)
        .map((r) => ({
          tone: String(r.tone) as ReplyTone,
          text: String(r.text),
          principle: String(r.principle ?? TONE_LABELS[String(r.tone) as ReplyTone]).toUpperCase(),
          why: String(r.why ?? ''),
        }))
    : [];
  if (replies.length === 0) throw new Error('AI returned no usable replies');

  const fading = stage === 'stalled' || zone === 'cold';
  const fallbackCoaching = coachingFor(stage, zone, fading);

  return {
    stage,
    interest,
    zone,
    signals,
    fading,
    verdict: typeof p.verdict === 'string' && p.verdict ? p.verdict : verdictFor(zone),
    coachingNote:
      typeof p.coachingNote === 'string' && p.coachingNote
        ? p.coachingNote
        : fallbackCoaching.note,
    coachingSource:
      typeof p.coachingSource === 'string' && p.coachingSource
        ? p.coachingSource.toUpperCase()
        : fallbackCoaching.source,
    replies,
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

export interface SavedConvo {
  id: string;
  name: string;
  context: ChatContext;
  savedAt: string; // ISO
  stage: ConversationStage;
  interest: number;
  raw: string;
}

function readLS(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLS(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — ignore */
  }
}

export function loadSavedConvos(): SavedConvo[] {
  const raw = readLS(STORAGE_KEYS.convos);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as SavedConvo[];
    return Array.isArray(arr) ? arr.filter((c) => c && typeof c.raw === 'string') : [];
  } catch {
    return [];
  }
}

export function persistSavedConvos(list: SavedConvo[]): void {
  writeLS(STORAGE_KEYS.convos, JSON.stringify(list));
}

export function loadAISettings(): AISettings {
  return {
    apiKey: readLS(STORAGE_KEYS.apikey) ?? '',
    endpoint: readLS(STORAGE_KEYS.endpoint) ?? DEFAULT_ENDPOINT,
    model: readLS(STORAGE_KEYS.model) ?? DEFAULT_MODEL,
  };
}

export function persistAISettings(s: AISettings): void {
  writeLS(STORAGE_KEYS.apikey, s.apiKey);
  writeLS(STORAGE_KEYS.endpoint, s.endpoint);
  writeLS(STORAGE_KEYS.model, s.model);
}

export function loadMode(): EngineMode {
  return readLS(STORAGE_KEYS.mode) === 'ai' ? 'ai' : 'rules';
}

export function persistMode(m: EngineMode): void {
  writeLS(STORAGE_KEYS.mode, m);
}

export function loadFavs(): string[] {
  const raw = readLS(STORAGE_KEYS.favs);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as string[];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function persistFavs(favs: string[]): void {
  writeLS(STORAGE_KEYS.favs, JSON.stringify(favs));
}

/* -------------------------------- sample ----------------------------------- */

export const SAMPLE_THREAD = `HER: okay I have to know — did you actually make that pasta from scratch or is that profile fraud?
ME: Hand-cut, flour everywhere, kitchen looked like a crime scene. But yes, from scratch. My nonna would approve.
HER: hahaha okay respect!! I've been trying to master carbonara for MONTHS and it always turns into scrambled eggs
ME: The trick is taking the pan off the heat before the eggs go in. I could teach you, but it costs you — I charge in wine and compliments.
HER: LOL deal!! There's a natural wine place near me that changed my life, their orange wine is unreal
ME: See, this is why I keep you around. Strong opinions on pasta AND a wine hookup.
HER: keep me around?? you're lucky I find you funny 😂 what else are you secretly good at, mysterious pasta man?
ME: I make a mean negroni and I'm unbeatable at naming that one actor from that one thing. You? Hidden talents?
HER: I can parallel park in one fluid motion and I make the best espresso martini in this city, verified by science
ME: "Verified by science" is doing a lot of work there. I'm going to need to peer-review this claim in person.
HER: hahaha peer review accepted. Thursday works for me if you're brave enough`;
