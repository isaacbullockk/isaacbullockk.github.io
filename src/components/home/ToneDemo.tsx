import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clipboard } from 'lucide-react';
import { EASE_EXPO } from '@/lib/splitText';
import type { Tone } from '@/lib/engine';
import { cn } from '@/lib/utils';

const CHAT: { sender: 'her' | 'you'; text: string }[] = [
  { sender: 'her', text: 'confession: I judge bars by whether they’d let me bring a book' },
  { sender: 'you', text: 'and I judge books by whether they’d survive a bar. we should compare notes' },
  { sender: 'her', text: 'haha yes!! also the bookstore has to SMELL right. old paper + dust' },
  { sender: 'you', text: 'you’re describing that shop on 9th with the mezcal place next door' },
  { sender: 'her', text: 'wait exactly that one. mezcal + old paper is my whole personality' },
];

const TONES: {
  id: Tone;
  label: string;
  color: string;
  reply: string;
  tag: string;
  why: string;
}[] = [
  {
    id: 'playful',
    label: 'PLAYFUL',
    color: '#D08C46',
    reply:
      'A mezcal bookstore crawl is dangerously specific and I’m in. Thursday, you pick the first shop, I’ll pretend to read the spines.',
    tag: 'HUMOR + ADVENTURE FRAME (HALL; DUTTON & ARON)',
    why: 'Play turns banter into a shared plan — the adventure sells itself, no pressure attached.',
  },
  {
    id: 'charming',
    label: 'CHARMING',
    color: '#B4683B',
    reply:
      'The way you described that bookstore — the smell line — told me more about you than your whole profile. There’s a mezcal place two doors from a shop like that. Thursday?',
    tag: 'RESPONSIVENESS (BIRNBAUM & REIS)',
    why: 'Quoting her exact words back signals attention — responsiveness is what actually predicts attraction.',
  },
  {
    id: 'direct',
    label: 'DIRECT',
    color: '#9E4A38',
    reply: 'I like this. Let’s do it in person — mezcal, Thursday, 8. If the week’s bad, name a day.',
    tag: 'KNOWN LIKING + CONCRETE ASK',
    why: 'Clear intent plus a specific, low-friction plan respects her time — and reads as confidence.',
  },
];

/** Section 4 — The Three Tones (home.md §4). Interactive demo of the real register switch. Framer-only tree. */
export default function ToneDemo() {
  const [tone, setTone] = useState<Tone>('playful');
  const [copied, setCopied] = useState(false);
  const active = TONES.find((t) => t.id === tone)!;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(active.reply);
    } catch {
      /* clipboard unavailable — still show the state */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section className="mx-auto max-w-[1200px] px-6 py-24 md:py-32 lg:px-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.75 }}
        transition={{ duration: 0.8, ease: EASE_EXPO }}
      >
        <p className="mono-label text-[12px] text-amber">N°03 — THREE WAYS IN</p>
        <h2 className="mt-6 font-display text-[34px] font-medium leading-[1.1] text-cream md:text-[56px] md:leading-[1.05]">
          Same her. <em className="font-normal italic text-amber-bright">Three yous.</em>
        </h2>
        <p className="mt-5 max-w-[520px] text-[19px] leading-[1.65] text-cream-dim">
          Every suggestion comes in three registers. Try it — this is the real engine.
        </p>
      </motion.div>

      {/* Demo card */}
      <motion.div
        className="mt-14 grid overflow-hidden rounded-xl border border-hairline bg-surface lg:grid-cols-[45%_55%]"
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: EASE_EXPO }}
      >
        {/* Left pane — sample conversation */}
        <div className="flex flex-col justify-end gap-3 border-b border-hairline p-6 md:p-8 lg:border-b-0 lg:border-r">
          {CHAT.map((m, i) => (
            <motion.div
              key={i}
              className={cn(
                'max-w-[85%] rounded-lg px-4 py-2.5 text-[14px] leading-[1.5]',
                m.sender === 'her'
                  ? 'self-start rounded-bl-sm bg-surface-2 text-cream'
                  : 'self-end rounded-br-sm bg-amber/[0.12] text-cream',
              )}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                duration: 0.35,
                ease: EASE_EXPO,
                // bubbles pop in sequence bottom-to-top, as if being typed
                delay: 0.15 + (CHAT.length - 1 - i) * 0.12,
              }}
            >
              {m.text}
            </motion.div>
          ))}
          <p className="mono-label mt-2 text-[10px] text-cream-faint">
            LIVE THREAD — HINGE · STAGE: RAPPORT · INTEREST 74
          </p>
        </div>

        {/* Right pane — tone tabs + suggestion */}
        <div className="p-6 md:p-8">
          {/* Tone tabs */}
          <div className="inline-flex rounded-full bg-surface-2 p-1" role="tablist" aria-label="Tone">
            {TONES.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tone === t.id}
                onClick={() => setTone(t.id)}
                className="relative rounded-full px-5 py-2"
              >
                {tone === t.id && (
                  <motion.span
                    layoutId="tone-pill"
                    className="absolute inset-0 rounded-full border"
                    style={{ backgroundColor: `${t.color}2E`, borderColor: t.color }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span
                  className="mono-label relative z-10 text-[12px] transition-colors duration-300"
                  style={{ color: tone === t.id ? t.color : '#A89C87' }}
                >
                  {t.label}
                </span>
              </button>
            ))}
          </div>

          {/* Reply */}
          <div className="mt-7 min-h-[190px]">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={tone}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: EASE_EXPO }}
                className="border-l-2 pl-5 font-display text-[20px] italic leading-[1.45] text-cream md:text-[24px]"
                style={{ borderColor: active.color }}
              >
                “{active.reply}”
              </motion.blockquote>
            </AnimatePresence>
          </div>

          {/* Principle chip */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${tone}-tag`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mt-5"
            >
              <span
                className="mono-label inline-block rounded border px-2.5 py-1.5 text-[10.5px]"
                style={{ borderColor: `${active.color}66`, color: active.color }}
              >
                {active.tag}
              </span>
              <p className="mt-3 text-[13px] leading-[1.4] text-cream-dim">{active.why}</p>
            </motion.div>
          </AnimatePresence>

          {/* Copy chip */}
          <motion.button
            onClick={copy}
            whileTap={{ scale: 0.97 }}
            animate={copied ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.16 }}
            className={cn(
              'mono-label mt-7 inline-flex items-center gap-2 rounded border px-4 py-2.5 text-[11px] transition-colors duration-300',
              copied
                ? 'border-sage text-sage'
                : 'border-hairline text-cream-dim hover:border-amber hover:text-cream',
            )}
            data-cursor-label="COPY"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
            {copied ? 'COPIED ✓' : 'COPY'}
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}
