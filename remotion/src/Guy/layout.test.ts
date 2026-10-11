import { describe, expect, test } from 'vitest';
import sample from '../../fixtures/timeline.sample.json';
import { VIDEO, safeBox } from '../brand';
import { parseTimeline } from '../timeline';
import { guyPose } from './motion';
import { GUY_SCALE, guyLayout } from './layout';

const tl = parseTimeline(JSON.parse(JSON.stringify(sample)));
const times = Array.from({ length: Math.floor(tl.duration / 0.05) + 1 }, (_, i) => i * 0.05);

describe('guyLayout', () => {
  test('centre position puts the head in the middle of the frame', () => {
    const l = guyLayout(0, GUY_SCALE, VIDEO.width);
    expect((l.headLeft + l.headRight) / 2).toBeCloseTo(VIDEO.width / 2);
  });

  test("the head stays inside the safe box in every pose of the sample", () => {
    const box = safeBox();
    for (const t of times) {
      const l = guyLayout(guyPose(tl, t, 0.5).x, GUY_SCALE, VIDEO.width);
      expect(l.headLeft).toBeGreaterThanOrEqual(box.x);
      expect(l.headRight).toBeLessThanOrEqual(box.x + box.width);
    }
  });

  test('his feet end above the bottom unsafe edge', () => {
    const box = safeBox();
    expect(guyLayout(0, GUY_SCALE, VIDEO.width).bottom).toBeLessThanOrEqual(box.y + box.height);
  });
});
