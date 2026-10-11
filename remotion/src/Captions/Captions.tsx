import { CAPTION_FONT, COLORS } from '../brand';
import { fitFontSize } from './fitFont';
import { activeGroup, type CaptionGroup } from './groupWords';

const MAX_WIDTH = 900;
const BASE_FONT_PX = 120;
const POP_FRAMES = 4;

export type CaptionsProps = { groups: CaptionGroup[]; frame: number; fps: number };

/** The current caption: lower third, rounded bold white with a thick black outline. */
export function Captions({ groups, frame, fps }: CaptionsProps) {
  const group = activeGroup(groups, frame / fps);
  if (!group) return null;

  const sinceStart = frame - Math.round(group.start * fps);
  const pop = Math.min(1, Math.max(0, sinceStart / POP_FRAMES));
  const scale = 0.8 + 0.2 * pop;

  return (
    <div
      style={{
        position: 'absolute',
        top: '72%',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          maxWidth: MAX_WIDTH,
          textAlign: 'center',
          textTransform: 'lowercase',
          fontFamily: CAPTION_FONT,
          fontWeight: 900,
          fontSize: fitFontSize(group.text, MAX_WIDTH, BASE_FONT_PX),
          lineHeight: 1.05,
          color: COLORS.white,
          WebkitTextStroke: '16px #000',
          paintOrder: 'stroke fill',
          transform: `scale(${scale})`,
        }}
      >
        {group.text}
      </div>
    </div>
  );
}
