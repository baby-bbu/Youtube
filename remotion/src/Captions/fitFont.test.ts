import { describe, expect, test } from 'vitest';
import { fitFontSize } from './fitFont';

describe('fitFontSize', () => {
  test('a short word keeps the base size', () => {
    expect(fitFontSize('cook', 960, 120)).toBe(120);
  });

  test('a very long word shrinks to fit, but not below 40', () => {
    const size = fitFontSize('internationalization', 960, 120);
    expect(size).toBeLessThanOrEqual(87);
    expect(size).toBeGreaterThanOrEqual(40);
  });

  test('never goes below the 40px floor even for absurd input', () => {
    expect(fitFontSize('x'.repeat(500), 960, 120)).toBe(40);
  });

  test('empty text keeps the base size', () => {
    expect(fitFontSize('', 960, 120)).toBe(120);
  });
});
