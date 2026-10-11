import type { Transition } from '../types';

const BASE_FRAMES_AT_30FPS: Record<Transition, number> = {
  'slide-left': 8,
  'slide-right': 8,
  zoom: 6,
  whip: 5,
  cut: 0,
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Horizontal offset in px of the incoming shot. A 'left' slide enters from the right
 * (starts at +width), a 'right' slide enters from the left (starts at -width); both ease
 * out to 0.
 */
export function slideOffset(progress: number, direction: 'left' | 'right', width: number): number {
  const eased = 1 - Math.pow(1 - clamp01(progress), 3);
  const magnitude = width * (1 - eased);
  return direction === 'left' ? magnitude : -magnitude;
}

/** Frames a transition takes: scaled to the frame rate and never more than half the shot. */
export function transitionFrames(kind: Transition, fps: number, shotFrames: number): number {
  const scaled = Math.round((BASE_FRAMES_AT_30FPS[kind] * fps) / 30);
  return Math.max(0, Math.min(scaled, Math.floor(shotFrames / 2)));
}
