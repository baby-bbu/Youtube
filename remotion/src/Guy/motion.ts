import { shotAt, wordAt } from '../timeline';
import type { GuyPose, MouthShape, Position, Timeline } from '../types';

/** The character picks a new head position this often (slow and gentle). */
export const BEAT_SECONDS = 1.1;
/** The mouth changes shape this often while a word is being spoken. */
const MOUTH_BEAT_SECONDS = 0.12;
/** Time taken to ease from one head position to the next at the start of a beat. */
const EASE_SECONDS = 0.7;
/** Time taken to glide to a new frame position at the start of a shot. */
const GLIDE_SECONDS = 0.25;

const MAX_FACE_X = 28;
/** How much of the allowed head turn is actually used; keeps the movement subtle. */
const TURN_AMOUNT = 0.85;
const MAX_TILT = 10;
// +-0.30 keeps the head inside the platform-safe box (see brand.ts SAFE_ZONE).
const POSITION_X: Record<Position, number> = { left: -0.3, centre: 0, right: 0.3 };
const TALKING_MOUTHS: MouthShape[] = ['small', 'oh', 'teeth', 'big'];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smoothstep = (x: number) => x * x * (3 - 2 * x);

/** Deterministic pseudo-random number in [0, 1) from (seed, beat, salt); no hidden state. */
export function beatRandom(seed: number, beat: number, salt: number): number {
  let h = (Math.imul(seed | 0, 374761393) + Math.imul(beat | 0, 668265263) + Math.imul(salt | 0, 2246822519)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  let t = ((h ^ (h >>> 16)) >>> 0) + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function armsFor(action: string, t: number, pulse: number): { left: number; right: number } {
  switch (action) {
    case 'point':
      return { left: 4 * Math.sin(t * 2), right: -40 };
    case 'wave':
      return { left: 4 * Math.sin(t * 2), right: -35 + 24 * Math.sin(t * 10) };
    case 'shrug':
      return { left: 35 * pulse, right: -35 * pulse };
    case 'bounce':
      return { left: 20 * pulse, right: -20 * pulse };
    default:
      return { left: 4 * Math.sin(t * 2), right: -4 * Math.sin(t * 2 + 1) };
  }
}

export function guyPose(tl: Timeline, t: number, loudness: number): GuyPose {
  const shot = shotAt(tl, t);
  const word = wordAt(shot, t);

  const beat = Math.floor(t / BEAT_SECONDS);
  const into = t - beat * BEAT_SECONDS;
  const ease = smoothstep(clamp(into / EASE_SECONDS, 0, 1));
  const targetX = (b: number) => (beatRandom(tl.seed, b, 1) * 2 - 1) * MAX_FACE_X * TURN_AMOUNT;
  const tiltNoise = (b: number) => (beatRandom(tl.seed, b, 2) - 0.5) * 4;
  const faceX = targetX(beat - 1) + (targetX(beat) - targetX(beat - 1)) * ease;
  const noise = tiltNoise(beat - 1) + (tiltNoise(beat) - tiltNoise(beat - 1)) * ease;
  const tilt = clamp((faceX / MAX_FACE_X) * 8 + noise, -MAX_TILT, MAX_TILT);

  const pulse = Math.abs(Math.sin((Math.PI * into) / BEAT_SECONDS));
  let bob = word?.emphasis ? 5 : 1.5 * pulse;
  if (shot.character.action === 'bounce') bob += 4 * pulse;

  let mouth: MouthShape = 'closed';
  if (word) {
    const r = (salt: number) => beatRandom(tl.seed, Math.floor(t / MOUTH_BEAT_SECONDS), salt);
    if (loudness < 0.15) mouth = 'small';
    else if (loudness >= 0.6) mouth = r(3) < 0.5 ? 'big' : 'wide';
    else mouth = TALKING_MOUTHS[Math.floor(r(4) * TALKING_MOUTHS.length)];
  }

  const index = tl.shots.indexOf(shot);
  const targetPos = POSITION_X[shot.character.position];
  let x = targetPos;
  if (index > 0 && t - shot.start < GLIDE_SECONDS) {
    const from = POSITION_X[tl.shots[index - 1].character.position];
    x = from + (targetPos - from) * smoothstep(clamp((t - shot.start) / GLIDE_SECONDS, 0, 1));
  }
  x += 0.02 * Math.sin(t * 1.7);

  const arms = armsFor(shot.character.action, t, pulse);
  return { x, faceX, tilt, bob, mouth, leftArm: arms.left, rightArm: arms.right };
}
