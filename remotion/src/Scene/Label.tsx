import { CAPTION_FONT, COLORS } from '../brand';
import { fitFontSize } from '../Captions/fitFont';

const MAX_WIDTH = 900;
const BASE_FONT_PX = 220;

/** One big outlined word, centred, for key beats. */
export function Label({ text }: { text: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '14%',
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
