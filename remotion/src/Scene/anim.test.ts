import { describe, expect, test } from 'vitest';
import { ENTRANCES, LOOPS } from '../types';
import { ENTRANCE_SECONDS, entrance, loopMotion, resolveAt } from './anim';

const shot = {
  start: 10,
  words: [
    { word: 'Nice', start: 10.2, end: 10.5, emphasis: false },
    { word: 'Sam.', start: 11.4, end: 11.8, emphasis: false },
  ],
};

describe('resolveAt', () => {
  test('numbers pass through and a missing time means the start', () => {
    expect(resolveAt(1.5, shot)).toBe(1.5);
    expect(resolveAt(undefined, shot)).toBe(0);
  });
  test('"word:" finds the word, ignoring case and punctuation, as time into the shot', () => {
    expect(resolveAt('word:sam', shot)).toBeCloseTo(1.4);
    expect(resolveAt('word:NICE', shot)).toBeCloseTo(0.2);
  });
  test('an unknown word falls back to the start instead of throwing', () => {
    expect(resolveAt('word:banana', shot)).toBe(0);
  });
});

describe('entrance', () => {
  test.each([...ENTRANCES])('%s is hidden before it appears', (kind) => {
    expect(entrance(kind, -0.1).visible).toBe(false);
    expect(entrance(kind, -0.1).opacity).toBe(0);
  });
  test.each([...ENTRANCES])('%s ends fully in place, with no NaN', (kind) => {
    const end = entrance(kind, ENTRANCE_SECONDS + 5);
    expect(end).toEqual({ visible: true, opacity: 1, x: 0, y: 0, scale: 1, rot: 0 });
    for (let t = 0; t <= 1; t += 0.05) {
      for (const v of Object.values(entrance(kind, t))) expect(Number.isNaN(v)).toBe(false);
    }
  });
  test('pop overshoots past full size before settling', () => {
    const peak = Math.max(...Array.from({ length: 25 }, (_, i) => entrance('pop', (i / 24) * ENTRANCE_SECONDS).scale));
    expect(peak).toBeGreaterThan(1.05);
  });
  test('slides start off the correct edge', () => {
    expect(entrance('slide-left', 0).x).toBeLessThan(0);
    expect(entrance('slide-right', 0).x).toBeGreaterThan(0);
  });
});

describe('loopMotion', () => {
  test('none does nothing and every loop is finite and repeatable', () => {
    expect(loopMotion('none', 3)).toEqual({ x: 0, y: 0, rot: 0, scale: 1 });
    for (const kind of LOOPS) {
      expect(loopMotion(kind, 1.234)).toEqual(loopMotion(kind, 1.234));
      for (const v of Object.values(loopMotion(kind, 99))) expect(Number.isFinite(v)).toBe(true);
    }
  });
  test('motion stays small enough to feel calm', () => {
    for (let t = 0; t < 5; t += 0.01) {
      expect(Math.abs(loopMotion('bob', t).y)).toBeLessThanOrEqual(10);
      expect(Math.abs(loopMotion('wiggle', t).rot)).toBeLessThanOrEqual(5);
    }
  });
});
