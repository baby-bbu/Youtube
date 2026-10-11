import { describe, expect, test } from 'vitest';
import sample from '../../fixtures/timeline.sample.json';
import { parseTimeline, shotAt, wordAt } from '../timeline';
import { MOUTHS } from '../types';
import { beatRandom, guyPose } from './motion';

const load = () => parseTimeline(JSON.parse(JSON.stringify(sample)));
const tl = load();
const times = Array.from({ length: Math.floor(tl.duration / 0.05) + 1 }, (_, i) => i * 0.05);
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

describe('beatRandom', () => {
  test('is deterministic and depends on the seed', () => {
    expect(beatRandom(1234, 5, 1)).toBe(beatRandom(1234, 5, 1));
    expect(beatRandom(1234, 5, 1)).not.toBe(beatRandom(1235, 5, 1));
  });

  test('stays in [0, 1)', () => {
    for (let beat = 0; beat < 200; beat++) {
      const r = beatRandom(1234, beat, 1);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(1);
    }
  });
});

describe('guyPose', () => {
  test('is deterministic', () => {
    expect(guyPose(tl, 3.2, 0.5)).toEqual(guyPose(tl, 3.2, 0.5));
  });

  test('a different seed gives a different performance', () => {
    const other = parseTimeline({ ...JSON.parse(JSON.stringify(sample)), seed: 99 });
    const differs = times.some((t) => guyPose(tl, t, 0.5).faceX !== guyPose(other, t, 0.5).faceX);
    expect(differs).toBe(true);
  });

  test('face turn and tilt stay within limits', () => {
    for (const t of times) {
      const p = guyPose(tl, t, 0.5);
      expect(Math.abs(p.faceX)).toBeLessThanOrEqual(28);
      expect(Math.abs(p.tilt)).toBeLessThanOrEqual(10);
    }
  });

  test('the face turns to both sides, not stuck on one', () => {
    const xs = times.map((t) => guyPose(tl, t, 0.5).faceX);
    expect(xs.filter((x) => x < -10).length / xs.length).toBeGreaterThanOrEqual(0.1);
    expect(xs.filter((x) => x > 10).length / xs.length).toBeGreaterThanOrEqual(0.1);
  });

  test('position follows the shot', () => {
    expect(guyPose(tl, 1.0, 0.5).x).toBeLessThan(0); // shot 1: left
    expect(guyPose(tl, 3.0, 0.5).x).toBeGreaterThan(0); // shot 2: right
    expect(Math.abs(guyPose(tl, 5.0, 0.5).x)).toBeLessThan(0.1); // shot 3: centre
  });

  test('mouth is always one of the six shapes', () => {
    for (const t of times) expect(MOUTHS).toContain(guyPose(tl, t, 0.5).mouth);
  });

  test('mouth is closed when nobody is speaking', () => {
    expect(wordAt(shotAt(tl, 0.02), 0.02)).toBeNull();
    expect(guyPose(tl, 0.02, 0.9).mouth).toBe('closed');
  });

  test('a shot with no words keeps the mouth closed throughout', () => {
    const raw = JSON.parse(JSON.stringify(sample));
    for (const shot of raw.shots) shot.words = [];
    const silent = parseTimeline(raw);
    for (const t of times) expect(guyPose(silent, t, 0.9).mouth).toBe('closed');
  });

  test('quiet speech gives a small mouth, loud speech a big or wide one', () => {
    expect(guyPose(tl, 0.7, 0.05).mouth).toBe('small'); // inside "cook"
    expect(['big', 'wide']).toContain(guyPose(tl, 0.7, 0.9).mouth);
  });

  test('emphasised words bob more than ordinary words', () => {
    const emph: number[] = [];
    const plain: number[] = [];
    for (const t of times) {
      const word = wordAt(shotAt(tl, t), t);
      if (!word) continue;
      (word.emphasis ? emph : plain).push(guyPose(tl, t, 0.5).bob);
    }
    expect(emph.length).toBeGreaterThan(0);
    expect(mean(emph)).toBeGreaterThan(mean(plain));
  });

  test('arm angles stay within +-60 degrees', () => {
    for (const t of times) {
      const p = guyPose(tl, t, 0.5);
      expect(Math.abs(p.leftArm)).toBeLessThanOrEqual(60);
      expect(Math.abs(p.rightArm)).toBeLessThanOrEqual(60);
    }
  });
});
