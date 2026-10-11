import { describe, expect, test } from 'vitest';
import { loudnessAtFrame, loudnessSeries } from './loudness';

const SR = 8000;
const FPS = 30;

/** 3 seconds of silence with a loud 440 Hz burst between 1.0 s and 1.5 s. */
function burstSignal(): Float32Array {
  const samples = new Float32Array(3 * SR);
  for (let i = Math.floor(1.0 * SR); i < Math.floor(1.5 * SR); i++) {
    samples[i] = 0.8 * Math.sin((2 * Math.PI * 440 * i) / SR);
  }
  return samples;
}

describe('loudnessSeries', () => {
  test('silence gives all zeros and no NaN', () => {
    const series = loudnessSeries(new Float32Array(3 * SR), SR, FPS, 3);
    expect(series.every((v) => v === 0)).toBe(true);
  });

  test('empty audio gives zeros of the right length', () => {
    const series = loudnessSeries([], SR, FPS, 2);
    expect(series).toHaveLength(60);
    expect(series.every((v) => v === 0)).toBe(true);
  });

  test('has one value per video frame', () => {
    expect(loudnessSeries(burstSignal(), SR, FPS, 3)).toHaveLength(Math.ceil(3 * FPS));
    expect(loudnessSeries(burstSignal(), SR, FPS, 2.51)).toHaveLength(Math.ceil(2.51 * FPS));
  });

  test('a burst is loud and the silence around it is quiet', () => {
    const series = loudnessSeries(burstSignal(), SR, FPS, 3);
    for (let f = 30; f <= 44; f++) expect(series[f]).toBeGreaterThan(0.6);
    for (let f = 0; f <= 25; f++) expect(series[f]).toBeLessThan(0.05);
    for (let f = 50; f < series.length; f++) expect(series[f]).toBeLessThan(0.05);
  });

  test('a quiet recording still reaches full range (normalised)', () => {
    const quiet = burstSignal().map((v) => v * 0.01);
    const series = loudnessSeries(quiet, SR, FPS, 3);
    expect(Math.max(...series)).toBeGreaterThan(0.9);
  });

  test('values always stay within 0..1', () => {
    const series = loudnessSeries(burstSignal(), SR, FPS, 3);
    expect(Math.min(...series)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...series)).toBeLessThanOrEqual(1);
  });
});

describe('loudnessAtFrame', () => {
  const series = [0.1, 0.5, 0.9];
  test('reads the value for a frame', () => {
    expect(loudnessAtFrame(series, 1)).toBe(0.5);
  });
  test('returns 0 outside the range', () => {
    expect(loudnessAtFrame(series, -1)).toBe(0);
    expect(loudnessAtFrame(series, 9999)).toBe(0);
  });
});
