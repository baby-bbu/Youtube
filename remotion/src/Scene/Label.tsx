import { CAPTION_FONT, COLORS, SAFE_ZONE, safeBox } from '../brand';
import { fitFontSize } from '../Captions/fitFont';

const MAX_WIDTH = safeBox().width;
const BASE_FONT_PX = 220;

/** One big outlined word, centred, for key beats. */
export function Label({ text }: { text: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: SAFE_ZONE.top + 20,
        left: SAFE_ZONE.left,
        width: MAX_WIDTH,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          maxWidth: MAX_WIDTH,
          textAlign: 'center',
          fontFamily: CAPTION_FONT,
          fontWeight: 900,
          fontSize: fitFontSize(text, MAX_WIDTH, BASE_FONT_PX),
          color: COLORS.white,
          WebkitTextStroke: '22px #000',
          paintOrder: 'stroke fill',
        }}
      >
        {text}
      </div>
    </div>
  );
}
