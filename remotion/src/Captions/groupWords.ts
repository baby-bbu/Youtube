import type { Timeline } from '../types';

export type CaptionGroup = { text: string; start: number; end: number };

const SENTENCE_END = /[.?!]$/;

/**
 * Splits each shot's words into captions of one to three words. A new caption starts
 * after maxWords words, after a pause longer than maxGap seconds, or after a word that
 * ends a sentence. Captions never span two shots.
 */
export function captionGroups(
  tl: Timeline,
  opts: { maxWords?: number; maxGap?: number } = {},
): CaptionGroup[] {
  const maxWords = opts.maxWords ?? 3;
  const maxGap = opts.maxGap ?? 0.35;
  const groups: CaptionGroup[] = [];

  for (const shot of tl.shots) {
    let current: typeof shot.words = [];
    const flush = () => {
      if (current.length === 0) return;
      groups.push({
        text: current.map((w) => w.word).join(' '),
        start: current[0].start,
        end: current[current.length - 1].end,
      });
      current = [];
    };

    for (const w of shot.words) {
      const prev = current[current.length - 1];
      if (
        prev &&
        (current.length >= maxWords || w.start - prev.end > maxGap || SENTENCE_END.test(prev.word))
      ) {
        flush();
      }
      current.push(w);
    }
    flush();
  }
  return groups;
}

export function activeGroup(groups: CaptionGroup[], t: number): CaptionGroup | null {
  return groups.find((g) => t >= g.start && t < g.end) ?? null;
}
