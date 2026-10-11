import type { ReactNode } from 'react';
import { CAPTION_FONT, COLORS } from '../brand';
import type { PropName } from '../types';

const INK = COLORS.ink;
export const PAL = {
  red: '#FF5B4A', pink: '#FF9EB5', yellow: COLORS.yellow, green: '#4CC36B', bread: '#EDBB6B',
  crust: '#C98A3C', sky: '#6EC6FF', brown: '#B57A45', cream: '#FFF6DC', white: COLORS.white,
};
/** Screen-pixel line weights (see Prop: strokes do not scale with the prop's size). */
const LINE_PX = 11;
const THIN_PX = 7;
const line = { stroke: INK, strokeWidth: LINE_PX, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Every prop is drawn on a 200x200 canvas with thick ink lines and flat colour. */
type DrawProps = { text?: string };

const Shades = ({ x, y, w = 70 }: { x: number; y: number; w?: number }) => (
  <g fill={INK}>
    <rect x={x - w / 2} y={y} width={w * 0.45} height={w * 0.28} rx={8} />
    <rect x={x + w * 0.05} y={y} width={w * 0.45} height={w * 0.28} rx={8} />
    <rect x={x - 4} y={y + 5} width={8} height={5} />
  </g>
);

const DRAW: Record<PropName, (p: DrawProps) => ReactNode> = {
  nametag: ({ text }) => {
    const name = text ?? 'SAM';
    return (
      <g {...line}>
        <rect x="22" y="40" width="156" height="128" rx="16" fill={PAL.white} />
        <path d="M22 56 a16 16 0 0 1 16 -16 h124 a16 16 0 0 1 16 16 v40 h-156 z" fill={PAL.red} />
        <text x="100" y="77" textAnchor="middle" fontFamily={CAPTION_FONT} fontWeight={900} fontSize="31" fill="#fff" stroke="none">HELLO</text>
        <text x="100" y="92" textAnchor="middle" fontFamily={CAPTION_FONT} fontWeight={700} fontSize="13" fill="#fff" stroke="none">my name is</text>
        <text x="100" y="148" textAnchor="middle" fontFamily={CAPTION_FONT} fontWeight={900} fontSize={name.length > 5 ? 30 : name.length > 3 ? 40 : 50} fill={INK} stroke="none">{name}</text>
        <circle cx="100" cy="26" r="8" fill={PAL.white} />
      </g>
    );
  },
  clock: ({ text }) => (
    <g {...line}>
      <circle cx="54" cy="36" r="17" fill={PAL.yellow} />
      <circle cx="146" cy="36" r="17" fill={PAL.yellow} />
      <circle cx="100" cy="96" r="58" fill={PAL.white} />
      <path d="M100 48 v8 M100 144 v-8 M52 96 h8 M148 96 h-8" fill="none" strokeWidth={THIN_PX} />
      <path d="M100 96 V64 M100 96 L122 108" fill="none" />
      <circle cx="100" cy="96" r="5" fill={INK} />
      {text && <text x="100" y="196" textAnchor="middle" fontFamily={CAPTION_FONT} fontWeight={900} fontSize="40" fill={INK} stroke="none">{text}</text>}
    </g>
  ),
  brain: () => (
    <g {...line}>
      <path d="M100 38 C82 18 42 26 40 62 C20 72 22 104 42 112 C38 140 70 156 88 142 C94 150 106 150 112 142 C130 156 162 140 158 112 C178 104 180 72 160 62 C158 26 118 18 100 38 Z" fill={PAL.pink} />
      <path d="M100 40 C92 62 108 82 98 104 C94 118 104 128 100 142" fill="none" strokeWidth={THIN_PX} />
      <path d="M54 76 C68 62 82 72 78 88 M50 108 C64 98 76 110 72 126 M146 76 C132 62 118 72 122 88 M150 108 C136 98 124 110 128 126" fill="none" strokeWidth={THIN_PX} />
      <path d="M92 150 C94 168 106 168 108 150" fill={PAL.pink} />
      <Shades x={100} y={80} w={62} />
    </g>
  ),
  bulb: () => (
    <g {...line}>
      <path d="M100 20 C58 20 40 54 52 86 C60 106 76 114 76 134 H124 C124 114 140 106 148 86 C160 54 142 20 100 20 Z" fill={PAL.yellow} />
      <rect x="76" y="134" width="48" height="14" rx="5" fill={PAL.white} />
      <rect x="82" y="150" width="36" height="14" rx="5" fill={PAL.white} />
      <path d="M92 170 h16" />
      <path d="M100 134 V104 M84 104 l16 -14 l16 14" fill="none" strokeWidth={THIN_PX} />
      <path d="M22 40 l14 10 M178 40 l-14 10 M12 90 h16 M172 90 h16" fill="none" />
    </g>
  ),
  sandwich: () => (
    <g {...line}>
      <rect x="22" y="132" width="156" height="30" rx="14" fill={PAL.bread} />
      <path d="M26 132 q14 -22 28 0 q14 -22 28 0 q14 -22 28 0 q14 -22 28 0 q14 -22 28 0" fill={PAL.green} />
      <circle cx="70" cy="118" r="11" fill={PAL.red} />
      <circle cx="132" cy="116" r="11" fill={PAL.red} />
      <path d="M24 100 H176 V114 H24 Z" fill="#FFC93C" />
      <path d="M20 100 C20 40 180 40 180 100 Z" fill={PAL.bread} />
      <circle cx="82" cy="82" r="6" fill={INK} stroke="none" />
      <circle cx="118" cy="82" r="6" fill={INK} stroke="none" />
      <path d="M88 94 q12 12 24 0" fill="none" strokeWidth={THIN_PX} />
    </g>
  ),
  checklist: () => (
    <g {...line}>
      <rect x="32" y="20" width="136" height="170" rx="14" fill={PAL.brown} />
      <rect x="46" y="42" width="108" height="136" rx="6" fill={PAL.white} />
      <rect x="76" y="12" width="48" height="26" rx="8" fill={PAL.yellow} />
      {[66, 100, 134].map((y) => (
        <g key={y}>
          <rect x="56" y={y - 12} width="24" height="24" rx="4" fill="none" strokeWidth={THIN_PX} />
          <path d={`M60 ${y} l7 8 l14 -18`} stroke={PAL.green} strokeWidth={13} fill="none" />
          <path d={`M92 ${y} h50`} strokeWidth={THIN_PX} fill="none" />
        </g>
      ))}
    </g>
  ),
  door: () => (
    <g {...line}>
      <rect x="40" y="14" width="120" height="176" fill={INK} />
      <path d="M40 14 L128 34 V176 L40 190 Z" fill={PAL.brown} />
      <rect x="58" y="52" width="40" height="38" rx="4" fill={PAL.sky} strokeWidth={THIN_PX} />
      <circle cx="112" cy="110" r="7" fill={PAL.yellow} strokeWidth={THIN_PX} />
    </g>
  ),
  question: () => (
    <text x="100" y="168" textAnchor="middle" fontFamily={CAPTION_FONT} fontWeight={900} fontSize="190" fill={PAL.yellow} stroke={INK} strokeWidth="14" paintOrder="stroke">?</text>
  ),
  star: () => (
    <path {...line} d="M100 16 L122 72 L184 76 L136 114 L152 174 L100 142 L48 174 L64 114 L16 76 L78 72 Z" fill={PAL.yellow} />
  ),
  xmark: () => (
    <g stroke={INK} strokeWidth={40} strokeLinecap="round"><path d="M44 44 L156 156 M156 44 L44 156" /><path d="M44 44 L156 156 M156 44 L44 156" stroke={PAL.red} strokeWidth={22} /></g>
  ),
  check: () => (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none"><path d="M36 106 L84 154 L168 46" stroke={INK} strokeWidth={36} /><path d="M36 106 L84 154 L168 46" stroke={PAL.green} strokeWidth={22} /></g>
  ),
  lock: () => (
    <g {...line}>
      <path d="M58 90 V64 a42 42 0 0 1 84 0 V90" fill="none" strokeWidth={14} />
      <rect x="36" y="86" width="128" height="94" rx="16" fill={PAL.yellow} />
      <circle cx="100" cy="124" r="12" fill={INK} />
      <path d="M100 130 V152" strokeWidth={10} />
    </g>
  ),
  notebook: () => (
    <g {...line}>
      <path d="M20 50 L100 66 L180 50 V162 L100 178 L20 162 Z" fill={PAL.cream} />
      <path d="M100 66 V178" fill="none" />
      <path d="M38 84 l48 10 M38 108 l48 10 M38 132 l48 10 M114 94 l48 -10 M114 118 l48 -10" fill="none" strokeWidth={THIN_PX} />
      <path d="M150 20 l22 22 l-52 52 l-26 6 l6 -26 Z" fill={PAL.yellow} />
    </g>
  ),
  sparkle: () => (
    <path {...line} d="M100 14 C108 68 132 92 186 100 C132 108 108 132 100 186 C92 132 68 108 14 100 C68 92 92 68 100 14 Z" fill={PAL.yellow} />
  ),
};

/** A prop drawn at `size` px square. */
export function Prop({ name, size, text }: { name: PropName; size: number; text?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
      <style>{'.px *{vector-effect:non-scaling-stroke}'}</style>
      <g className="px">{DRAW[name]({ text })}</g>
    </svg>
  );
}
