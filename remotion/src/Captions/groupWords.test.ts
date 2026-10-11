import { describe, expect, test } from 'vitest';
import sample from '../../fixtures/timeline.sample.json';
import { parseTimeline } from '../timeline';
import type { Timeline, Word } from '../types';
import { activeGroup, captionGroups } from './groupWords';

const word = (text: string, start: number, end: number): Word => ({
  word: text,
  start,
  end,
  emphasis: false,
});

/** The sample timeline with each listed shot's words replaced. */
function withWords(replacements: Record<number, Word[]>): Timeline {
  const raw = JSON.parse(JSON.stringify(sample));
  for (const [id, words] of Object.entries(replacements)) {
    raw.shots.find((s: { id: number }) => s.id === Number(id)).words = words;
  }
  return parseTimeline(raw);
}

const seven = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'].map((w, i) =>
  word(w, 0.1 + i * 0.1, 0.2 + i * 0.1),
);

describe('captionGroups', () => {
  test('seven back-to-back words make groups of 3, 3 and 1', () => {
    const groups = captionGroups(withWords({ 1: seven, 2: [], 3: [], 4: [] }));
    expect(groups.map((g) => g.text)).toEqual(['one two three', 'four five six', 'seven']);
  });

  test('a group carries the start of its first word and the end of its last', () => {
    const [first] = captionGroups(withWords({ 1: seven, 2: [], 3: [], 4: [] }));
    expect(first.start).toBeCloseTo(0.1);
    expect(first.end).toBeCloseTo(0.4);
  });

  test('a pause longer than 0.35s starts a new group', () => {
    const words = [word('a', 0.1, 0.2), word('b', 0.2, 0.3), word('c', 0.8, 0.9)];
    const groups = captionGroups(withWords({ 1: words, 2: [], 3: [], 4: [] }));
    expect(groups.map((g) => g.text)).toEqual(['a b', 'c']);
  });

  test('a word that ends a sentence ends its group', () => {
    for (const mark of ['.', '?', '!']) {
      const words = [word(`hi${mark}`, 0.1, 0.2), word('there', 0.2, 0.3)];
      const groups = captionGroups(withWords({ 1: words, 2: [], 3: [], 4: [] }));
      expect(groups.map((g) => g.text)).toEqual([`hi${mark}`, 'there']);
    }
  });

  test('a group never spans two shots', () => {
    const groups = captionGroups(
      withWords({
        1: [word('alpha', 2.3, 2.39)],
        2: [word('beta', 2.4, 2.5)],
        3: [],
        4: [],
      }),
    );
    expect(groups.map((g) => g.text)).toEqual(['alpha', 'beta']);
  });

  test('shots with no words contribute no groups', () => {
    const groups = captionGroups(withWords({ 1: [], 2: [], 3: [], 4: [] }));
    expect(groups).toEqual([]);
  });

  test('maxWords can be changed', () => {
    const groups = captionGroups(withWords({ 1: seven, 2: [], 3: [], 4: [] }), { maxWords: 2 });
    expect(groups.map((g) => g.text)).toEqual(['one two', 'three four', 'five six', 'seven']);
  });
});

describe('activeGroup', () => {
  const groups = [
    { text: 'a b', start: 1, end: 2 },
    { text: 'c', start: 2.5, end: 3 },
  ];
  test('returns the group whose [start, end) contains t', () => {
    expect(activeGroup(groups, 1)?.text).toBe('a b');
    expect(activeGroup(groups, 2.7)?.text).toBe('c');
  });
  test('returns null outside every group', () => {
    expect(activeGroup(groups, 0.5)).toBeNull();
    expect(activeGroup(groups, 2)).toBeNull();
    expect(activeGroup(groups, 3)).toBeNull();
  });
});
