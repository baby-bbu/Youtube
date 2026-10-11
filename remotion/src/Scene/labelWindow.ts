import type { Shot } from '../types';

/** How long a shot's big label stays up: long enough to read, short enough to clear the frame. */
export const LABEL_SECONDS = 1.0;

/**
 * Whether the big outlined label should be on screen at time t. A shot with no picture
 * shows its label on its title card instead, so it never gets a second copy.
 */
export function shouldShowLabel(shot: Shot, t: number): boolean {
  return Boolean(shot.label) && Boolean(shot.image) && t >= shot.start && t - shot.start < LABEL_SECONDS;
}
