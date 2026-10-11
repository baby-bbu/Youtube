import { describe, expect, test } from 'vitest';
import { slideOffset, transitionFrames } from './transitions';

describe('slideOffset', () => {
  test('a left slide starts a full width to the right and ends at 0', () => {
    expect(slideOffset(0, 'left', 1080)).toBe(1080);
    expect(slideOffset(1, 'left', 1080)).toBeCloseTo(0);
  });

  test('a right slide starts a full width to the left', () => {
    expect(slideOffset(0, 'right', 1080)).toBe(-1080);
    expect(slideOffset(1, 'right', 1080)).toBeCloseTo(0);
  });

  test('eases out: moves monotonically toward 0', () => {
    let last = Infinity;
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const m = Math.abs(slideOffset(p, 'left', 1080));
      expect(m).toBeLessThanOrEqual(last);
      last = m;
    }
  });
});

describe('transitionFrames', () => {
  test('a cut takes no frames', () => {
    expect(transitionFrames('cut', 30, 90)).toBe(0);
  });

  test('base lengths at 30 fps', () => {
    expect(transitionFrames('slide-left', 30, 90)).toBe(8);
    expect(transitionFrames('slide-right', 30, 90)).toBe(8);
    expect(transitionFrames('zoom', 30, 90)).toBe(6);
    expect(transitionFrames('whip', 30, 90)).toBe(5);
  });

  test('scales with the frame rate', () => {
    expect(transitionFrames('slide-left', 60, 200)).toBe(16);
    expect(transitionFrames('slide-left', 15, 45)).toBe(4);
  });

  test('a very short shot clamps the transition to half the shot, never negative', () => {
    expect(transitionFrames('slide-left', 30, 6)).toBeLessThanOrEqual(3);
    expect(transitionFrames('slide-left', 30, 1)).toBe(0);
    expect(transitionFrames('slide-left', 30, 0)).toBe(0);
  });
});
