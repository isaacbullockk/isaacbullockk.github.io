/**
 * Engine regression checks (dev-only, not shipped):
 *  BUG 2 — template fallback grammar ("our that debate" must not appear)
 *  BUG 3 — low-sample confidence dampener (4-message hot thread must not
 *          score hot; LOW SAMPLE signal must surface)
 *
 * Run: node scripts/engine-check.mjs
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const BUNDLE = path.join(HERE, 'ocr-test/out/engine.bundle.mjs');

execFileSync(path.join(ROOT, 'node_modules/.bin/esbuild'), [
  'src/lib/engine.ts', '--bundle', '--format=esm', '--platform=node',
  `--outfile=${BUNDLE}`,
], { cwd: ROOT, stdio: 'inherit' });

const engine = await import(BUNDLE);
const { parseThread, suggestReplies, runRulesAnalysis, scoreInterest, interestZone } = engine;

let failures = 0;
const check = (label, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

/* ---- BUG 2: fallback grammar across every stage/tone/seed ---- */
const noTopic = parseThread('HER: hi there\nME: hey, how is your week going\nHER: good!! you?\nME: pretty great actually\nHER: nice\nME: we should keep this going');
const BAD = /\b(our that|this that|your that|a that|the that)\b/i;
let badFound = [];
for (const stage of ['opener', 'rapport', 'building', 'ask', 'stalled']) {
  for (let seed = 0; seed < 4; seed++) {
    const replies = suggestReplies({
      stage, zone: 'warming', signals: [], messages: noTopic, context: 'texting', seed,
    });
    for (const r of replies) if (BAD.test(r.text)) badFound.push(`[${stage}/${r.tone}/s${seed}] ${r.text}`);
  }
}
check('BUG2 no broken fallback phrasing in any template', badFound.length === 0, badFound[0]);

const building = suggestReplies({
  stage: 'building', zone: 'warming', signals: [], messages: noTopic, context: 'texting', seed: 0,
});
console.log('  sample (building/playful, no topic):', building.find((r) => r.tone === 'playful').text);

/* ---- BUG 3: low-sample dampener ---- */
const shortHot = parseThread(`HER: hahaha you're actually funny, what's your story?
ME: No story, just a man with a pasta machine and dreams. You?
HER: obsessed with carbonara, tell me everything??
ME: Only in person. I charge in wine and compliments.`);
console.log(`  short thread messages: ${shortHot.length}`);
const { score, signals } = scoreInterest(shortHot);
const zone = interestZone(score);
check('BUG3 4-message hot thread is dampened out of HOT zone', zone !== 'hot', `score ${score} zone ${zone}`);
check('BUG3 LOW SAMPLE — EARLY READ signal surfaced',
  signals.some((s) => s.label === 'LOW SAMPLE — EARLY READ'));

const full = runRulesAnalysis(
  `HER: hahaha you're actually funny, what's your story?\nME: No story, just a man with a pasta machine and dreams. You?\nHER: obsessed with carbonara, tell me everything??\nME: Only in person. I charge in wine and compliments.`,
  'texting',
);
check('BUG3 full analysis dampened too', full.zone !== 'hot', `score ${full.interest} zone ${full.zone}`);

/* ---- regression: long hot thread still scores hot, no LOW SAMPLE ---- */
const longHot = parseThread(engine.SAMPLE_THREAD);
const longRes = scoreInterest(longHot);
check('regression long hot thread keeps high score', longRes.score >= 66, `score ${longRes.score} (${longHot.length} msgs)`);
check('regression long thread has no LOW SAMPLE flag',
  !longRes.signals.some((s) => s.label === 'LOW SAMPLE — EARLY READ'));

/* ---- regression: with a real topic, templates still use it ---- */
const withTopic = suggestReplies({
  stage: 'building', zone: 'hot', signals: [], messages: longHot, context: 'hinge', seed: 0,
});
check('regression topic callback still injected',
  withTopic.some((r) => /pasta|carbonara|wine|espresso/.test(r.text)),
  withTopic.find((r) => r.tone === 'playful').text);

console.log(failures === 0 ? '\nALL ENGINE CHECKS PASS' : `\n${failures} ENGINE CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
