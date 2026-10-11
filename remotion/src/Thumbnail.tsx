import { AbsoluteFill } from 'remotion';
import { CAPTION_FONT, COLORS } from './brand';
import { Guy } from './Guy/Guy';
import { Prop } from './Scene/props';
import type { PropName } from './types';

export type ThumbnailProps = {
  /** two short lines, e.g. ["FORGET", "NAMES?"]; the second line is drawn white with a black outline */
  lines: [string, string];
  /** the prop drawn next to the guy, and its optional label */
  prop?: PropName;
  tag?: string;
};

const WIDE = { width: 1280, height: 720 } as const;
const TALL = { width: 1080, height: 1920 } as const;
export const THUMBNAIL_SIZES = { wide: WIDE, tall: TALL };

const POSE = { x: 0, faceX: 8, tilt: -5, bob: 0, mouth: 'big', leftArm: 25, rightArm: -55 } as const;

const outlined = (size: number) =>
  ({
    fontFamily: CAPTION_FONT,
    fontWeight: 900,
    fontSize: size,
    lineHeight: 0.95,
    letterSpacing: '0.01em',
    WebkitTextStroke: `${Math.round(size * 0.16)}px ${COLORS.ink}`,
    paintOrder: 'stroke fill',
    filter: 'drop-shadow(0 10px 0 rgba(15,15,15,0.35))',
  }) as const;

/** The cover image: big bold hook words, the Rundown Guy looking shocked, a prop that sums up the topic. */
export function Thumbnail({ lines, prop = 'nametag', tag = '???', wide }: ThumbnailProps & { wide: boolean }) {
  const dots = {
    backgroundColor: COLORS.yellow,
    backgroundImage: 'radial-gradient(#FFE46B 11px, transparent 12px)',
    backgroundSize: '96px 96px',
  };
  if (wide) {
    return (
      <AbsoluteFill style={dots}>
        <div style={{ position: 'absolute', left: 64, top: 90 }}>
          <div style={{ ...outlined(165), color: COLORS.ink, WebkitTextStroke: '0px', filter: 'none' }}>{lines[0]}</div>
          <div style={{ ...outlined(165), color: COLORS.white, marginTop: 6 }}>{lines[1]}</div>
        </div>
        <div style={{ position: 'absolute', left: 70, top: 405, transform: 'rotate(-7deg)', filter: 'drop-shadow(8px 10px 0 rgba(15,15,15,0.28))' }}>
          <Prop name={prop} size={250} text={tag} />
        </div>
        <div style={{ position: 'absolute', left: 700, top: 40 }}>
          <Guy pose={POSE} sticker scale={1.5} />
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={dots}>
      <div style={{ position: 'absolute', left: 90, top: 250, width: 810, textAlign: 'center' }}>
        <div style={{ ...outlined(185), color: COLORS.ink, WebkitTextStroke: '0px', filter: 'none' }}>{lines[0]}</div>
        <div style={{ ...outlined(185), color: COLORS.white, marginTop: 8 }}>{lines[1]}</div>
      </div>
      <div style={{ position: 'absolute', left: 60, top: 640, transform: 'rotate(-7deg)', filter: 'drop-shadow(8px 10px 0 rgba(15,15,15,0.28))' }}>
        <Prop name={prop} size={300} text={tag} />
      </div>
      <div style={{ position: 'absolute', left: 215, top: 745 }}>
        <Guy pose={POSE} sticker scale={1.9} />
      </div>
    </AbsoluteFill>
  );
}
