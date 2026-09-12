/**
 * SplitText-style char/word splitting via custom util (design.md §7).
 * Each char is wrapped in an overflow-hidden mask span so it can rise
 * from y:110% — the brand's kinetic-type move. Call `revert()` on teardown.
 */

export interface SplitResult {
  /** Inner animated spans (translate these). */
  targets: HTMLElement[];
  revert: () => void;
}

const MASK_CLASS = 'wm-split-mask';
const INNER_CLASS = 'wm-split-inner';

function wrapNode(textNode: Text, by: 'chars' | 'words', targets: HTMLElement[]) {
  const parent = textNode.parentNode as HTMLElement;
  const text = textNode.textContent ?? '';
  const frag = document.createDocumentFragment();
  const units = by === 'chars' ? text.split(/(?=.)/u) : text.split(/(\s+)/);

  for (const unit of units) {
    if (unit === '') continue;
    if (by === 'words' && /^\s+$/.test(unit)) {
      frag.appendChild(document.createTextNode(' '));
      continue;
    }
    const mask = document.createElement('span');
    mask.className = MASK_CLASS;
    mask.style.display = 'inline-block';
    mask.style.overflow = 'hidden';
    mask.style.verticalAlign = 'bottom';
    const inner = document.createElement('span');
    inner.className = INNER_CLASS;
    inner.style.display = 'inline-block';
    inner.style.willChange = 'transform';
    inner.textContent = unit === ' ' ? ' ' : unit;
    mask.appendChild(inner);
    frag.appendChild(mask);
    targets.push(inner);
  }
  parent.replaceChild(frag, textNode);
}

function collectTextNodes(el: HTMLElement): Text[] {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let n = walker.nextNode();
  while (n) {
    if ((n.textContent ?? '').length > 0) nodes.push(n as Text);
    n = walker.nextNode();
  }
  return nodes;
}

function split(el: HTMLElement, by: 'chars' | 'words'): SplitResult {
  const original = el.innerHTML;
  const targets: HTMLElement[] = [];
  // Snapshot first — the walker would see mutated nodes otherwise.
  for (const node of collectTextNodes(el)) wrapNode(node, by, targets);
  return {
    targets,
    revert: () => {
      el.innerHTML = original;
    },
  };
}

/** Split every text node of `el` into per-char masked spans (nested markup preserved). */
export function splitChars(el: HTMLElement): SplitResult {
  return split(el, 'chars');
}

/** Split every text node of `el` into per-word masked spans (nested markup preserved). */
export function splitWords(el: HTMLElement): SplitResult {
  return split(el, 'words');
}

/** Global ease used across the site (design.md §5). */
export const EASE_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];
