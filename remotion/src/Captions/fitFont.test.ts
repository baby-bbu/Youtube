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

  test('bold capitals are wider than lowercase, so a short all-caps label still shrinks', () => {
    // "COOKING" at 220px was clipped at the frame edge in the first sample render.
    expect(fitFontSize('COOKING', 900, 220)).toBeLessThanOrEqual(164);
    expect(fitFontSize('cooking', 900, 220)).toBe(220);
  });

  test('never goes below the 40px floor even for absurd input', () => {
    expect(fitFontSize('x'.repeat(500), 960, 120)).toBe(40);
  });

  test('empty text keeps the base size', () => {
    expect(fitFontSize('', 960, 120)).toBe(120);
  });
});
