import type { At, Entrance, Loop, Shot } from '../types';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;
/** Overshoots past 1 and settles back: the "pop" feel. */
export const easeOutBack = (p: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2;
};
const easeOutBounce = (p: number) => {
  const n = 7.5625;
  const d = 2.75;
  if (p < 1 / d) return n * p * p;
  if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75;
  if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375;
  return n * (p -= 2.625 / d) * p + 0.984375;
};

export const ENTRANCE_SECONDS = 0.5;

export type ItemState = { visible: boolean; opacity: number; x: number; y: number; scale: number; rot: number };

/** Seconds after the shot starts when an item appears. Unknown words count as the start. */
export function resolveAt(at: At | undefined, shot: Pick<Shot, 'start' | 'words'>): number {
  if (at === undefined) return 0;
  if (typeof at === 'number') return at;
  const needle = at.slice(5).toLowerCase().replace(/[^a-z0-9']/g, '');
  const hit = shot.words.find((w) => w.word.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(needle));
  return hit ? Math.max(0, hit.start - shot.start) : 0;
}

/** Where an item is while it arrives; `local` is seconds since it appeared (negative = not yet). */
export function entrance(kind: Entrance, local: number): ItemState {
  if (local < 0) return { visible: false, opacity: 0, x: 0, y: 0, scale: 1, rot: 0 };
  const p = clamp01(local / ENTRANCE_SECONDS);
  const rest: ItemState = { visible: true, opacity: 1, x: 0, y: 0, scale: 1, rot: 0 };
  switch (kind) {
    case 'pop':
      return { ...rest, scale: Math.max(0, easeOutBack(p)) };
    case 'drop':
      return { ...rest, y: (easeOutBounce(p) - 1) * 700 };
    case 'slide-left':
      return { ...rest, x: (easeOutCubic(p) - 1) * 1000 };
    case 'slide-right':
      return { ...rest, x: (1 - easeOutCubic(p)) * 1000 };
    case 'rise':
      return { ...rest, y: (1 - easeOutCubic(p)) * 260, opacity: p };
    case 'spin':
      return { ...rest, rot: (easeOutCubic(p) - 1) * 360, scale: Math.max(0, easeOutBack(p)) };
    default:
      return { ...rest, opacity: p };
  }
}

/** Gentle repeating motion that runs for as long as the item is on screen. */
export function loopMotion(kind: Loop, t: number): { x: number; y: number; rot: number; scale: number } {
  switch (kind) {
    case 'bob':
      return { x: 0, y: Math.sin(t * 4) * 10, rot: 0, scale: 1 };
    case 'wiggle':
      return { x: 0, y: 0, rot: Math.sin(t * 6) * 5, scale: 1 };
    case 'pulse':
      return { x: 0, y: 0, rot: 0, scale: 1 + Math.sin(t * 5) * 0.06 };
    case 'shake':
      return { x: Math.sin(t * 40) * 5, y: 0, rot: Math.sin(t * 33) * 2, scale: 1 };
    case 'spin':
      return { x: 0, y: 0, rot: (t * 90) % 360, scale: 1 };
    default:
      return { x: 0, y: 0, rot: 0, scale: 1 };
  }
}
