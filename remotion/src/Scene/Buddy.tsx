import { COLORS } from '../brand';
import type { Action, Hat } from '../types';

const INK = COLORS.ink;

export type BuddyProps = {
  hat: Hat;
  action: Action;
  /** seconds since the scene item appeared; drives blinking and arm swings */
  t: number;
  talking?: boolean;
  /** true when the second guy stands on the right and faces left */
  flip?: boolean;
  scale: number;
  /** true when the guy is holding something out in front of him */
  holding?: boolean;
};

/** Shoulder pivot of both arms, from the Rundown Guy artwork. */
const SHOULDER = '200 338';

export function buddyArms(action: Action, t: number, holding: boolean): { near: number; far: number } {
  if (holding) return { near: -80, far: 6 * Math.sin(t * 2) };
  switch (action) {
    case 'wave':
      return { near: -150 + 22 * Math.sin(t * 10), far: 4 * Math.sin(t * 2) };
    case 'point':
      return { near: -85, far: 4 * Math.sin(t * 2) };
    case 'shrug':
      return { near: -35 + 6 * Math.sin(t * 3), far: 35 - 6 * Math.sin(t * 3) };
    case 'bounce':
      return { near: -25 * Math.abs(Math.sin(t * 6)), far: 25 * Math.abs(Math.sin(t * 6)) };
    default:
      return { near: 4 * Math.sin(t * 2), far: -4 * Math.sin(t * 2 + 1) };
  }
}

const HAT_ART: Record<Hat, React.ReactNode> = {
  none: null,
  beanie: (
    <g stroke={INK} strokeWidth={7} strokeLinejoin="round">
      <path d="M108 160 C100 96 150 82 200 82 C250 82 300 96 292 160 Z" fill="#FF5B4A" />
      <rect x="104" y="150" width="192" height="26" rx="12" fill="#FFB3A8" />
      <circle cx="200" cy="80" r="16" fill="#FFB3A8" />
    </g>
  ),
  tophat: (
    <g stroke={INK} strokeWidth={7} strokeLinejoin="round">
      <rect x="140" y="30" width="120" height="118" rx="8" fill="#2a2a2a" />
      <rect x="140" y="112" width="120" height="22" fill="#FF5B4A" />
      <rect x="104" y="146" width="192" height="22" rx="10" fill="#2a2a2a" />
    </g>
  ),
  party: (
    <g stroke={INK} strokeWidth={7} strokeLinejoin="round">
      <path d="M200 20 L262 152 H138 Z" fill="#B79CFF" />
      <path d="M170 90 L230 90 M156 122 L244 122" stroke="#FFD400" strokeWidth={9} />
      <circle cx="200" cy="20" r="14" fill="#FFD400" />
    </g>
  ),
  headband: (
    <g stroke={INK} strokeWidth={7} strokeLinejoin="round">
      <path d="M110 158 C150 128 250 128 290 158" fill="none" strokeWidth={20} stroke="#4CC36B" />
      <path d="M110 158 C150 128 250 128 290 158" fill="none" strokeWidth={7} />
      <path d="M268 138 l34 -24 l4 44 z M268 138 l-4 44 l34 -24 z" fill="#4CC36B" />
    </g>
  ),
  curly: (
    <g stroke={INK} strokeWidth={7}>
      {[[130, 130], [165, 108], [205, 100], [245, 108], [275, 130]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="26" fill="#8A5A2B" />
      ))}
    </g>
  ),
};

/**
 * "Sam": a second stickman with dot eyes (no shades) and a hat, so he reads as a
 * different person. Same body geometry as the Rundown Guy (400x520 canvas).
 */
export function Buddy({ hat, action, t, talking = false, flip = false, scale, holding = false }: BuddyProps) {
  const arms = buddyArms(action, t, holding);
  const blink = t % 3.1 < 0.12 ? 0.1 : 1;
  const hop = action === 'bounce' ? -Math.abs(Math.sin(t * 6)) * 22 : 0;
  const open = talking && Math.sin(t * 14) > -0.2;
  return (
    <svg
      width={400 * scale}
      height={450 * scale}
      viewBox="0 70 400 450"
      style={{ overflow: 'visible', transform: flip ? 'scaleX(-1)' : undefined }}
    >
      <g transform={`translate(0,${hop})`}>
        <g stroke={INK} strokeWidth={16} strokeLinecap="round" fill="none">
          <line x1="200" y1="312" x2="200" y2="404" />
          <line x1="200" y1="338" x2="250" y2="378" transform={`rotate(${arms.near} ${SHOULDER})`} />
          <line x1="200" y1="338" x2="150" y2="378" transform={`rotate(${arms.far} ${SHOULDER})`} />
          <line x1="200" y1="404" x2="172" y2="476" />
          <line x1="200" y1="404" x2="228" y2="476" />
        </g>
        <circle cx="200" cy="210" r="100" fill={COLORS.white} stroke={INK} strokeWidth={7} />
        <g fill={INK}>
          <ellipse cx="238" cy="206" rx="10" ry={14 * blink} />
          <ellipse cx="288" cy="206" rx="10" ry={14 * blink} />
        </g>
        <path d="M222 168 q16 -12 34 -2 M274 166 q16 -10 30 4" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
        {open ? (
          <ellipse cx="262" cy="262" rx="20" ry="16" fill="#fff" stroke={INK} strokeWidth={7} />
        ) : (
          <path d="M236 256 q26 24 52 0" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
        )}
        {HAT_ART[hat]}
      </g>
    </svg>
  );
}
