import { describe, expect, test } from 'vitest';
import { CAPTION_BOX, CAPTION_FONT, COLORS, SAFE_ZONE, VIDEO, safeBox } from './brand';

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

  test('safe zone is the conservative union of YouTube Shorts, TikTok and Reels margins', () => {
    expect(SAFE_ZONE).toEqual({ top: 250, bottom: 300, left: 90, right: 90 });
  });

  test('safeBox is what is left inside the frame', () => {
    expect(safeBox()).toEqual({ x: 90, y: 250, width: 900, height: 1370 });
  });

  test('the caption box sits inside the safe box', () => {
    const box = safeBox();
    expect(CAPTION_BOX.left).toBeGreaterThanOrEqual(box.x);
    expect(CAPTION_BOX.left + CAPTION_BOX.width).toBeLessThanOrEqual(box.x + box.width);
    expect(CAPTION_BOX.bottomY).toBeLessThanOrEqual(box.y + box.height);
  });

  test('captions and the safe box are centred exactly on the frame (YouTube only)', () => {
    expect(CAPTION_BOX.left * 2 + CAPTION_BOX.width).toBe(VIDEO.width);
    expect(SAFE_ZONE.left).toBe(SAFE_ZONE.right);
  });
});
