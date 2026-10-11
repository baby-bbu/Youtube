import { AbsoluteFill, Composition } from 'remotion';
import { CAPTION_FONT, COLORS, VIDEO } from './brand';

const Placeholder: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: COLORS.black,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <div
      style={{
        color: COLORS.yellow,
        fontFamily: CAPTION_FONT,
        fontWeight: 900,
        fontSize: 140,
      }}
    >
      Rundown Guy
    </div>
  </AbsoluteFill>
);

export const Root: React.FC = () => (
  <Composition
    id="Short"
    component={Placeholder}
    durationInFrames={90}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
);
