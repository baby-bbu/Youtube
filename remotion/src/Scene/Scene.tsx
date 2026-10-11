import { AbsoluteFill, Img, staticFile } from 'remotion';
import { CAPTION_FONT, COLORS } from '../brand';
import { fitFontSize } from '../Captions/fitFont';
import type { Shot } from '../types';
import { cameraTransform } from './camera';

const MAX_WIDTH = 900;

/** Plain card used when a shot has no picture: its label (or RUNDOWN) on yellow. */
function TitleCard({ label }: { label?: string }) {
  const text = label ?? 'RUNDOWN';
  return (
    <AbsoluteFill
      style={{ backgroundColor: COLORS.yellow, alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        style={{
          maxWidth: MAX_WIDTH,
          textAlign: 'center',
          fontFamily: CAPTION_FONT,
          fontWeight: 900,
          fontSize: fitFontSize(text, MAX_WIDTH, 200),
          color: COLORS.ink,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
}

type ImageComponent = React.ComponentType<{ src: string; style?: React.CSSProperties }>;

/**
 * A shot's background (image or title card) with its slow camera move. `Image` defaults
 * to Remotion's <Img> (which waits for the picture to load before a frame is captured);
 * tests inject a plain <img> because <Img> needs a composition context.
 */
export function Scene({
  shot,
  progress,
  Image = Img,
}: {
  shot: Shot;
  progress: number;
  Image?: ImageComponent;
}) {
  const cam = cameraTransform(shot.camera, progress);
  const transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})`;
  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: COLORS.black }}>
      <AbsoluteFill style={{ transform }}>
        {shot.image ? (
          <Image
            src={staticFile(shot.image)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <TitleCard label={shot.label} />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
