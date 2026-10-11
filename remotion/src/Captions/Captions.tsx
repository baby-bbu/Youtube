import { CAPTION_BOX, CAPTION_FONT, COLORS, VIDEO } from '../brand';
import { fitFontSize } from './fitFont';
import { activeGroup, type CaptionGroup } from './groupWords';

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
        left: CAPTION_BOX.left,
        width: CAPTION_BOX.width,
        bottom: VIDEO.height - CAPTION_BOX.bottomY,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
      }}
    >
      <div
        style={{
          maxWidth: CAPTION_BOX.width,
          textAlign: 'center',
          textTransform: 'lowercase',
          fontFamily: CAPTION_FONT,
          fontWeight: 900,
          fontSize: fitFontSize(group.text, CAPTION_BOX.width, BASE_FONT_PX),
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
