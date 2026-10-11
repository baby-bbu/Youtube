import type { Camera } from '../types';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Slow camera move for a shot; progress is 0 at the start of the shot, 1 at the end. */
export function cameraTransform(
  kind: Camera,
  progress: number,
): { scale: number; x: number; y: number } {
  const p = clamp01(progress);
  switch (kind) {
    case 'zoom-in':
      return { scale: 1 + 0.12 * p, x: 0, y: 0 };
    case 'zoom-out':
      return { scale: 1.12 - 0.12 * p, x: 0, y: 0 };
    case 'pan-left':
      return { scale: 1.1, x: -40 * p, y: 0 };
    case 'pan-right':
      return { scale: 1.1, x: 40 * p, y: 0 };
    default:
      return { scale: 1, x: 0, y: 0 };
  }
}
