import { COLORS } from '../brand';
import type { MouthShape } from '../types';

const OUTLINE = `fill="${COLORS.white}" stroke="${COLORS.ink}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;

const BIG = `<path d="M-38 -22 C6 -28 42 -18 40 6 C36 36 8 46 -16 32 C-32 22 -40 0 -38 -22 Z" ${OUTLINE}/>`;

/** SVG markup for each mouth, centred on the origin. White inside, ink outline. */
export const MOUTH_PATHS: Record<MouthShape, string> = {
  big: BIG,
  small: `<path d="M-22 -12 C2 -16 24 -10 22 4 C20 20 2 24 -10 16 C-20 10 -24 -2 -22 -12 Z" ${OUTLINE}/>`,
  oh: `<ellipse rx="14" ry="18" ${OUTLINE}/>`,
  teeth:
    `<rect x="-28" y="-11" width="56" height="22" rx="8" ${OUTLINE}/>` +
    `<path d="M-14 -10 V10 M0 -10 V10 M14 -10 V10" stroke="${COLORS.ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  closed: `<path d="M-24 0 H24 M-24 -8 V8 M24 -8 V8" stroke="${COLORS.ink}" stroke-width="6" stroke-linecap="round" fill="none"/>`,
  wide: `<g transform="scale(1.25,1.1)">${BIG}</g>`,
};
