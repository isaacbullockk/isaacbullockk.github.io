/**
 * Wingman Playbook + Science data (playbook.md, science.md).
 *
 * Ten research-backed principles, each with its study citation, the
 * historical master who embodied it, three example lines, and explicit
 * do/don't guidance. Also the full citation index (R1–R10) and the FAQ
 * used by the Science page. Pure data — no runtime behavior.
 */

export type MasterId = 'casanova' | 'byron' | 'franklin' | 'sinatra' | 'rubirosa';

export interface Master {
  id: MasterId;
  name: string;
  dates: string;
  /** Distilled move, used in gallery captions. */
  move: string;
  /** Mono chip label for the gallery card. */
  chip: string;
  img: string;
  /** First Playbook chapter this master anchors (1-based). */
  chapter: number;
}

export const MASTERS: Master[] = [
  {
    id: 'casanova',
    name: 'Giacomo Casanova',
    dates: '1725–1798',
    move: 'The Spotlight: total attention, perfect recall.',
    chip: 'CURIOSITY',
    img: '/portrait-casanova.png',
    chapter: 1,
  },
  {
    id: 'byron',
    name: 'Lord Byron',
    dates: '1788–1824',
    move: 'The Specific Compliment: praise what no one else noticed.',
    chip: 'SPECIFICITY',
    img: '/portrait-byron.png',
    chapter: 3,
  },
  {
    id: 'franklin',
    name: 'Benjamin Franklin',
    dates: '1706–1790',
    move: 'The Small Ask: a favor asked is a bond made.',
    chip: 'BEN FRANKLIN EFFECT',
    img: '/portrait-franklin.png',
    chapter: 4,
  },
  {
    id: 'sinatra',
    name: 'Frank Sinatra',
    dates: '1915–1998',
    move: 'The Presence: make her the only person in the room.',
    chip: 'FOCUS',
    img: '/portrait-sinatra.png',
    chapter: 2,
  },
  {
    id: 'rubirosa',
    name: 'Porfirio Rubirosa',
    dates: '1909–1965',
    move: 'The Adventure Frame: sell the experience, not the interview.',
    chip: 'NOVELTY',
    img: '/portrait-rubirosa.png',
    chapter: 5,
  },
];

export interface Chapter {
  /** 1-based chapter number. */
  n: number;
  /** Short mono index label, e.g. "SELF-DISCLOSURE". */
  indexLabel: string;
  /** Mono principle chip, e.g. "SELF-DISCLOSURE". */
  chip: string;
  title: string;
  science: string;
  citation: string;
  master: {
    id: MasterId;
    name: string;
    dates: string;
    img: string;
    anecdote: string;
  };
  lines: string[];
  do: string[];
  dont: string[];
}

export const CHAPTERS: Chapter[] = [
  {
    n: 1,
    indexLabel: 'SELF-DISCLOSURE',
    chip: 'SELF-DISCLOSURE',
    title: 'Escalating Self-Disclosure',
    science:
      'In the famous “36 Questions” paradigm, strangers who asked each other an escalating ladder of increasingly personal questions generated rapid, measurable closeness — while small-talk pairs stayed strangers. The mechanism is matched disclosure: each person trades one rung deeper. Closeness isn’t found; it’s climbed.',
    citation:
      'ARON, MELINAT, ARON, VALLONE & BATOR (1997) — “THE EXPERIMENTAL GENERATION OF INTERPERSONAL CLOSENESS.” PSPB.',
    master: {
      id: 'casanova',
      name: 'Giacomo Casanova',
      dates: '1725–1798',
      img: '/portrait-casanova.png',
      anecdote:
        'His seductions began as interviews. In the Histoire de ma vie, evenings open with hours of questions — her history, her tastes, her grievances — while he disclosed just enough of his own to keep the ladder climbing. He made her story the main event.',
    },
    lines: [
      'Trade you: your most unpopular opinion for mine.',
      'What’s something you’ve never put in a profile but probably should?',
      'Okay, deeper water: what did you want to be at ten?',
    ],
    do: [
      'Ladder from light to personal, one rung at a time.',
      'Trade disclosure for disclosure — answer your own questions.',
    ],
    dont: [
      'Interrogate without offering anything back.',
      'Jump intimate on message two.',
    ],
  },
  {
    n: 2,
    indexLabel: 'RESPONSIVENESS',
    chip: 'RESPONSIVENESS',
    title: 'Perceived Partner Responsiveness',
    science:
      'Across studies of early dating, feeling understood, validated, and cared for — what Birnbaum & Reis call perceived partner responsiveness — predicts desire more reliably than looks or status. Attraction is less “impress her” than “make her feel precisely heard.”',
    citation:
      'BIRNBAUM & REIS — PERCEIVED PARTNER RESPONSIVENESS AND DESIRE IN EARLY DATING.',
    master: {
      id: 'sinatra',
      name: 'Frank Sinatra',
      dates: '1915–1998',
      img: '/portrait-sinatra.png',
      anecdote:
        'Friends said that when Frank listened, the room fell away — whoever held his attention felt like the only person alive. He answered the feeling under the words, not the words themselves, and he never forgot what you told him.',
    },
    lines: [
      'Wait — you said that twice. You really loved that trip, didn’t you?',
      'That sounds equal parts amazing and exhausting. Which was it more?',
      'Noted: you take your coffee seriously and your mornings slowly. Adjusting accordingly.',
    ],
    do: [
      'Respond to the emotion, not just the facts.',
      'Remember details — and call them back days later.',
    ],
    dont: [
      'Perform sympathy you don’t feel.',
      'One-up her story with your own.',
    ],
  },
  {
    n: 3,
    indexLabel: 'SIMILARITY',
    chip: 'SIMILARITY–ATTRACTION',
    title: 'Similarity–Attraction',
    science:
      'Byrne’s similarity–attraction paradigm is one of the most replicated findings in social psychology: perceived similarity — in taste, values, quirks — predicts liking. The key word is perceived. Shared ground only works once it’s surfaced, and surfaced specifically.',
    citation: 'BYRNE — THE SIMILARITY–ATTRACTION PARADIGM.',
    master: {
      id: 'byron',
      name: 'Lord Byron',
      dates: '1788–1824',
      img: '/portrait-byron.png',
      anecdote:
        'Byron’s letters ran on found kinship — he quoted a correspondent’s favorite lines back to her, adopted her references, and named the shared taste precisely instead of vaguely. Resemblance, surfaced specifically, did the work grand gestures couldn’t.',
    },
    lines: [
      'You’re the only other person I’ve met who rates the rainy-day rewatch over the night out.',
      'A fellow morning swimmer — I was beginning to think the app made you up.',
      'Okay, we both judge restaurants by the bread basket. This is a foundation.',
    ],
    do: [
      'Surface real shared taste, and name it specifically.',
      'Let her introduce you to her world — curiosity is the compliment.',
    ],
    dont: [
      'Fake agreement — manufactured sameness reads as hollow within three messages.',
      'Mirror her opinions so hard you disappear.',
    ],
  },
  {
    n: 4,
    indexLabel: 'HUMOR & PLAY',
    chip: 'PLAYFULNESS',
    title: 'Humor & Playfulness',
    science:
      'Hall’s work on courtship humor found that shared laughter — not jokes delivered, but laughs exchanged — is among the strongest predictors of romantic interest. Playfulness signals safety, quickness, and a low-ego evening. The goal isn’t to be a comedian; it’s to be fun to be in a bit with.',
    citation: 'HALL (UNIVERSITY OF KANSAS) — HUMOR AND PLAYFULNESS IN COURTSHIP.',
    master: {
      id: 'franklin',
      name: 'Benjamin Franklin',
      dates: '1706–1790',
      img: '/portrait-franklin.png',
      anecdote:
        'Franklin charmed two continents with wit aimed mostly at himself — self-deprecation as a show of security. His letters are full of jokes where he is the punchline and the reader is in on it. Charm, for him, was generosity wearing a grin.',
    },
    lines: [
      'I’d say I peaked in the group chat, but honestly I peaked assembling IKEA without the manual.',
      'Careful — I have a bit about hotel breakfast buffets and I’m not afraid to use it.',
      'I laughed at my own joke before I finished typing it, so the bar for tonight is on the floor. Your turn.',
    ],
    do: [
      'Punch at harmless things — yourself included.',
      'Build bits and callbacks; a running joke is a private world.',
    ],
    dont: [
      'Tease insecurities — that’s negging, and it’s banned here.',
      'Force the bit when she’s gone sincere.',
    ],
  },
  {
    n: 5,
    indexLabel: 'NOVELTY',
    chip: 'NOVELTY',
    title: 'Misattribution of Arousal / Novelty',
    science:
      'In the shaky-bridge study, men who crossed a high, wobbling footbridge were likelier to call the interviewer waiting at the other end — the adrenaline lent its charge to the person. Exciting contexts transfer their energy to whoever shares them. Novelty is borrowed electricity.',
    citation: 'DUTTON & ARON (1974) — THE SHAKY-BRIDGE STUDY, JPSP.',
    master: {
      id: 'rubirosa',
      name: 'Porfirio Rubirosa',
      dates: '1909–1965',
      img: '/portrait-rubirosa.png',
      anecdote:
        'Polo player, pilot, racing driver — Rubirosa never proposed dinner and an interview; he proposed an evening with a pulse. Courtship, for him, was an adventure she happened to be invited on, and the invitation itself was half the charm.',
    },
    lines: [
      'There’s a night market Thursday. Come judge dumplings with me.',
      'Ever done trivia with a stranger? Tuesday, seven o’clock — we’ll lose gloriously.',
      'I know a rooftop with a terrible view and a great story. Sunset.',
    ],
    do: [
      'Propose activity dates with built-in texture — markets, games, views.',
      'Let the setting do some of the work.',
    ],
    dont: [
      'Manufacture stress or drama for the charge.',
      'Confuse novelty with chaos — it’s a frame, not a fire drill.',
    ],
  },
  {
    n: 6,
    indexLabel: 'BEN FRANKLIN EFFECT',
    chip: 'BEN FRANKLIN EFFECT',
    title: 'The Ben Franklin Effect',
    science:
      'Jecker & Landy verified Franklin’s old trick experimentally: people who do you a small favor end up liking you more — the mind resolves the dissonance by deciding you were worth it. Asking for a tiny favor isn’t imposition; it’s an invitation to invest.',
    citation: 'JECKER & LANDY (1969) — THE BEN FRANKLIN EFFECT.',
    master: {
      id: 'franklin',
      name: 'Benjamin Franklin',
      dates: '1706–1790',
      img: '/portrait-franklin.png',
      anecdote:
        'The man himself. He won over a hostile legislator by asking to borrow a rare book — and returned it with a warm note. “He that has once done you a kindness,” he wrote, “will be more ready to do you another.”',
    },
    lines: [
      'Settle a debate: best taco in the city? Loser buys.',
      'You clearly have taste — recommend me one song for tomorrow’s commute.',
      'Quick ruling: is a hot dog a sandwich? Your answer decides everything.',
    ],
    do: [
      'Small, fun asks — recommendations, rulings, tiebreakers.',
      'Thank warmly; report back on how it went.',
    ],
    dont: [
      'Ask actual burdens.',
      'Attach interest rates to the favor — it’s a game, not a loan.',
    ],
  },
  {
    n: 7,
    indexLabel: 'MOMENTUM',
    chip: 'MOMENTUM',
    title: 'Momentum & the Concrete Ask',
    science:
      'Dating-platform engagement data shows conversation-to-date conversion peaks inside a bounded window — banter that crests and idles decays fast. The ask lands when it’s specific, time-boxed, and easy to decline. Vagueness is where sparks go to die.',
    citation:
      'DATING-PLATFORM ENGAGEMENT RESEARCH — CONVERSATION-TO-DATE CONVERSION WINDOWS.',
    master: {
      id: 'rubirosa',
      name: 'Porfirio Rubirosa',
      dates: '1909–1965',
      img: '/portrait-rubirosa.png',
      anecdote:
        'He never let a spark idle. Friends marveled at how quickly an introduction became an invitation — always concrete, always with an easy out, never a scene. Momentum, handled lightly, was the whole game.',
    },
    lines: [
      'I’m enjoying this. Drinks Thursday? If the week’s chaos, no harm — rain check stands.',
      'We should test this chemistry in the wild. Coffee Saturday, the good place on Fifth.',
      'One meeting, one drink, forty minutes. Worst case: a story. Best case: you delete this app.',
    ],
    do: [
      'Ask within the peak — specific day, specific plan, graceful out.',
      'Make “no” cheap and “yes” concrete.',
    ],
    dont: [
      'Interrogate her calendar like a booking agent.',
      'Double-ask after a no.',
    ],
  },
  {
    n: 8,
    indexLabel: 'KNOWN LIKING',
    chip: 'KNOWN LIKING',
    title: 'Known Liking Beats Games',
    science:
      'The hard-to-get literature is weak and mixed; what consistently predicts attraction is expressed, genuine interest from someone with standards. Playing unavailable mostly selects for people who don’t believe you. Warmth, stated plainly, is the higher-EV move.',
    citation:
      'LITERATURE ON PLAYING HARD TO GET (MIXED/WEAK EFFECTS) VS. EXPRESSED INTEREST.',
    master: {
      id: 'sinatra',
      name: 'Frank Sinatra',
      dates: '1915–1998',
      img: '/portrait-sinatra.png',
      anecdote:
        'For all the cool, Sinatra’s courtships were famously direct — flowers, phone calls, attention you didn’t have to decode. The confidence was in the clarity: he liked you, and you knew it.',
    },
    lines: [
      'I like this. Let’s do it in person.',
      'Full disclosure: I check for your name when the phone lights up.',
      'No games on my end — I think you’re great and I’d like to see you again.',
    ],
    do: [
      'Be clearly warm; say the nice thing when you think it.',
      'Keep your standards; drop the strategy.',
    ],
    dont: [
      'Manufactured scarcity.',
      'Read-receipt games and strategic delays.',
    ],
  },
  {
    n: 9,
    indexLabel: 'SPECIFICITY',
    chip: 'SPECIFICITY',
    title: 'Name & Specificity',
    science:
      'Compliments on choices and personality — things she did, not things she has — read as attention; generic looks-compliments read as spam. Specificity is proof of work: it shows you actually read, listened, remembered.',
    citation:
      'SPECIFICITY RESEARCH — ATTENTION-AS-COMPLIMENT; PRIMARY SOURCE: BYRON’S LETTERS.',
    master: {
      id: 'byron',
      name: 'Lord Byron',
      dates: '1788–1824',
      img: '/portrait-byron.png',
      anecdote:
        'Byron’s letters were devastating because they were precise — he caught the exact turn of a phrase, the thing nobody else noticed. He never wrote “you’re beautiful” when he could write the specific way she’d just made a room laugh.',
    },
    lines: [
      'The way you described your grandmother’s kitchen — I can smell it. Tell me more.',
      'You didn’t just go to Lisbon, you took the wrong tram on purpose. I like how you move through the world.',
      'Nobody has ever defended pineapple on pizza with that much eloquence. Conviction looks good on you.',
    ],
    do: [
      'Praise choices, taste, turns of phrase.',
      'Use her name like you mean it.',
    ],
    dont: [
      'Generic looks-compliments.',
      'Any compliment you could paste to anyone.',
    ],
  },
  {
    n: 10,
    indexLabel: 'QUESTION RECIPROCITY',
    chip: 'FOLLOW-UPS',
    title: 'Question Reciprocity',
    science:
      'In speed-dating paradigms, people who ask follow-up questions — questions that continue what the other person just said — are rated significantly more likeable and land more second dates. The follow-up is the tell of real listening.',
    citation: 'EASTWICK & FINKEL — SPEED-DATING PARADIGMS; FOLLOW-UP QUESTIONS AND LIKING.',
    master: {
      id: 'casanova',
      name: 'Giacomo Casanova',
      dates: '1725–1798',
      img: '/portrait-casanova.png',
      anecdote:
        'Perfect recall, relentless follow-ups. Months later he’d ask about the brother she’d mentioned once, the fear she’d half-confessed. His attention compounded like interest.',
    },
    lines: [
      'You mentioned the audition Tuesday — how did it go?',
      'Back up — you almost moved to Lisbon? Tell me the whole story.',
      'And then what did your brother say? I need the sequel.',
    ],
    do: [
      'Follow up on what she just said — and on what she said last week.',
      'Let her finish the story before you top it.',
    ],
    dont: [
      'Topic-hop to your own material.',
      'Ask questions that are just your turn to talk.',
    ],
  },
];

/* ------------------------------ Science page ------------------------------ */

export interface Citation {
  /** Mono index, e.g. "R1". */
  id: string;
  /** Full citation text. */
  text: string;
  /** Journal / venue tail, set in italic. */
  venue?: string;
  /** One-line "what we took from it". */
  takeaway: string;
  /** Playbook chapter chip label + target (1-based chapter, 0 = masters gallery). */
  chip: string;
  chapter: number;
}

export const CITATIONS: Citation[] = [
  {
    id: 'R1',
    text: 'Aron, A., Melinat, E., Aron, E. N., Vallone, R. D., & Bator, R. J. (1997). “The Experimental Generation of Interpersonal Closeness.”',
    venue: 'Personality and Social Psychology Bulletin.',
    takeaway: 'Escalating questions create closeness fast.',
    chip: 'SELF-DISCLOSURE',
    chapter: 1,
  },
  {
    id: 'R2',
    text: 'Birnbaum, G. E., & Reis, H. T. — research on perceived partner responsiveness and desire in early dating.',
    takeaway: 'Feeling understood is the engine of attraction.',
    chip: 'RESPONSIVENESS',
    chapter: 2,
  },
  {
    id: 'R3',
    text: 'Byrne, D. — the similarity–attraction paradigm.',
    takeaway: 'Shared taste, surfaced specifically, predicts liking.',
    chip: 'SIMILARITY',
    chapter: 3,
  },
  {
    id: 'R4',
    text: 'Hall, J. A. (University of Kansas) — humor and playfulness in courtship.',
    takeaway: 'Shared laughter signals and builds romantic interest.',
    chip: 'PLAYFULNESS',
    chapter: 4,
  },
  {
    id: 'R5',
    text: 'Dutton, D. G., & Aron, A. P. (1974). The shaky-bridge study.',
    venue: 'JPSP.',
    takeaway: 'Exciting contexts lend their charge to you.',
    chip: 'NOVELTY',
    chapter: 5,
  },
  {
    id: 'R6',
    text: 'Jecker, J., & Landy, D. (1969). The Ben Franklin effect.',
    takeaway: 'Small favors asked create investment.',
    chip: 'BEN FRANKLIN EFFECT',
    chapter: 6,
  },
  {
    id: 'R7',
    text: 'Dating-platform engagement research (Hinge and industry data) on conversation-to-date conversion windows.',
    takeaway: 'Banter peaks decay; ask while it’s warm.',
    chip: 'MOMENTUM',
    chapter: 7,
  },
  {
    id: 'R8',
    text: 'Eastwick, P. W., & Finkel, E. J. — speed-dating paradigms; follow-up questions and liking.',
    takeaway: 'Follow-ups beat topic-switching.',
    chip: 'FOLLOW-UPS',
    chapter: 10,
  },
  {
    id: 'R9',
    text: 'Literature on playing hard to get (mixed/weak effects) vs. expressed interest.',
    takeaway: 'Warmth and clarity outperform games.',
    chip: 'KNOWN LIKING',
    chapter: 8,
  },
  {
    id: 'R10',
    text: 'Primary historical sources: Casanova’s Histoire de ma vie, Byron’s letters, Franklin’s correspondence; documented charisma of Sinatra and Rubirosa.',
    takeaway: 'The distilled moves of the masters.',
    chip: 'THE MASTERS',
    chapter: 0,
  },
];

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ: FaqItem[] = [
  {
    q: 'IS THIS A PICKUP-ARTIST TOOL?',
    a: 'No. PUAs sell manipulation scripts; we implement published research on responsiveness, disclosure and humor, and we hard-code the graceful exit.',
  },
  {
    q: 'DOES IT GUARANTEE RESULTS?',
    a: 'No honest tool can. It removes guesswork and bad habits; the rest is chemistry and her free choice.',
  },
  {
    q: 'WHAT DOES THE INTEREST METER ACTUALLY MEASURE?',
    a: 'Behavioral signals only: length deltas, questions back, reply latency, laughter density, initiative. It’s a heuristic read, not mind-reading.',
  },
  {
    q: 'IS MY DATA SAFE IN AI MODE?',
    a: 'Calls go browser→your endpoint directly. Check your provider’s policy; in rules mode nothing leaves the device at all.',
  },
  {
    q: 'WHY THREE TONES?',
    a: 'Different people, different moments. Playful builds fun, Charming builds feeling, Direct builds momentum. The stage read tells you which to lean on.',
  },
  {
    q: 'CAN I USE IT FOR NON-DATING CHATS?',
    a: 'It’s tuned for early-stage romance; the principles generalize, the templates don’t.',
  },
];

/** Chapter anchor id helper — shared by Playbook rows and Science chips. */
export function chapterAnchor(n: number): string {
  return `chapter-${String(n).padStart(2, '0')}`;
}

/** Copy helper — clipboard API with legacy fallback. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}
