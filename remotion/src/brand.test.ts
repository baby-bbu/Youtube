import { describe, expect, test } from 'vitest';
import { CAPTION_FONT, COLORS, VIDEO } from './brand';

describe('brand constants', () => {
  test('colours match the brand sheet', () => {
    expect(COLORS.yellow).toBe('#FFD400');
    expect(COLORS.black).toBe('#0F0F0F');
    expect(COLORS.ink).toBe('#111111');
    expect(COLORS.white).toBe('#FFFFFF');
  });

  test('video is 1080x1920 at 30 fps', () => {
    expect(VIDEO.width).toBe(1080);
    expect(VIDEO.height).toBe(1920);
    expect(VIDEO.fps).toBe(30);
  });

  test('caption font is a single string constant', () => {
    expect(typeof CAPTION_FONT).toBe('string');
    expect(CAPTION_FONT.length).toBeGreaterThan(0);
  });
});
