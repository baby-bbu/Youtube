import { describe, expect, test } from 'vitest';
import { CAMERAS } from '../types';
import { cameraTransform } from './camera';

describe('cameraTransform', () => {
  test('zoom-in goes from 1 to 1.12', () => {
    expect(cameraTransform('zoom-in', 0).scale).toBeCloseTo(1);
    expect(cameraTransform('zoom-in', 1).scale).toBeCloseTo(1.12);
  });

  test('zoom-out goes from 1.12 to 1', () => {
    expect(cameraTransform('zoom-out', 0).scale).toBeCloseTo(1.12);
    expect(cameraTransform('zoom-out', 1).scale).toBeCloseTo(1);
  });

  test('static never moves', () => {
    expect(cameraTransform('static', 0.7)).toEqual({ scale: 1, x: 0, y: 0 });
  });

  test('pan-left drifts to -40px at scale 1.1, pan-right to +40px', () => {
    expect(cameraTransform('pan-left', 1)).toEqual({ scale: 1.1, x: -40, y: 0 });
    expect(cameraTransform('pan-right', 1)).toEqual({ scale: 1.1, x: 40, y: 0 });
    expect(cameraTransform('pan-left', 0).x).toBeCloseTo(0);
  });

  test('progress outside 0..1 is clamped', () => {
    expect(cameraTransform('zoom-in', 5).scale).toBeCloseTo(1.12);
    expect(cameraTransform('zoom-in', -5).scale).toBeCloseTo(1);
  });

  test('every camera name is handled', () => {
    for (const kind of CAMERAS) {
      const t = cameraTransform(kind, 0.5);
      expect(Number.isFinite(t.scale) && Number.isFinite(t.x) && Number.isFinite(t.y)).toBe(true);
    }
  });
});
