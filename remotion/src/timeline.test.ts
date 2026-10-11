import { describe, expect, test } from 'vitest';
import sample from '../fixtures/timeline.sample.json';
import { parseTimeline, shotAt, TimelineError, wordAt } from './timeline';

const clone = () => JSON.parse(JSON.stringify(sample));

describe('parseTimeline', () => {
  test('parses the sample timeline', () => {
    const tl = parseTimeline(clone());
    expect(tl.shots).toHaveLength(4);
    expect(tl.seed).toBe(1234);
  });

  test('rejects something that is not an object', () => {
    expect(() => parseTimeline(null)).toThrow(TimelineError);
  });

  test('rejects a timeline with no shots', () => {
    const raw = clone();
    raw.shots = [];
    expect(() => parseTimeline(raw)).toThrow(TimelineError);
  });

  test('unknown action names the shot and the bad value', () => {
    const raw = clone();
    raw.shots[1].character.action = 'fly';
    expect(() => parseTimeline(raw)).toThrow(/shot 2.*fly|fly.*shot 2/);
    expect(() => parseTimeline(raw)).toThrow(TimelineError);
  });

  test('overlapping shots are rejected', () => {
    const raw = clone();
    raw.shots[1].start = 2.0;
    expect(() => parseTimeline(raw)).toThrow(/overlap/);
  });

  test('shots out of order are rejected', () => {
    const raw = clone();
    [raw.shots[0], raw.shots[1]] = [raw.shots[1], raw.shots[0]];
    expect(() => parseTimeline(raw)).toThrow(TimelineError);
  });

  test('a word that ends before it starts is rejected by name', () => {
    const raw = clone();
    raw.shots[0].words[2].end = 0.1;
    expect(() => parseTimeline(raw)).toThrow(/cook/);
  });
});

describe('shotAt', () => {
  const gapped = () => {
    const raw = clone();
    raw.shots[1].start = 2.6; // gap between 2.4 and 2.6
    return parseTimeline(raw);
  };

  test('holds the previous shot during a gap, never goes blank', () => {
    expect(shotAt(gapped(), 2.5).id).toBe(1);
  });

  test('before the first shot returns the first, after the last returns the last', () => {
    const tl = gapped();
    expect(shotAt(tl, -1).id).toBe(1);
    expect(shotAt(tl, 99).id).toBe(4);
  });

  test('a time exactly on a shot start belongs to that shot', () => {
    expect(shotAt(gapped(), 4.0).id).toBe(3);
  });
});

describe('wordAt', () => {
  const tl = parseTimeline(clone());

  test('returns the word whose [start, end) contains t', () => {
    expect(wordAt(tl.shots[0], 0.7)?.word).toBe('cook');
    expect(wordAt(tl.shots[0], 0.10)?.word).toBe('Learning');
  });

  test('returns null between words', () => {
    expect(wordAt(tl.shots[0], 0.99)).toBeNull();
  });

  test('a shot with no words always returns null', () => {
    const silent = { ...tl.shots[0], words: [] };
    expect(wordAt(silent, 0.7)).toBeNull();
  });
});
