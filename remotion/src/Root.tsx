import { Composition } from 'remotion';
import sample from '../fixtures/timeline.sample.json';
import { Short } from './Short';
import { parseTimeline } from './timeline';
import type { Timeline } from './types';

/**
 * The composition's props ARE the timeline (the pipeline writes timeline.json and
 * passes it with --props), so duration and size come straight from it.
 */
export const Root: React.FC = () => (
  <Composition
    id="Short"
    component={Short}
    durationInFrames={Math.ceil((sample as unknown as Timeline).duration * sample.fps)}
    fps={sample.fps}
    width={sample.width}
    height={sample.height}
    defaultProps={sample as unknown as Timeline}
    calculateMetadata={({ props }) => {
      const tl = parseTimeline(props);
      return {
        durationInFrames: Math.ceil(tl.duration * tl.fps),
        fps: tl.fps,
        width: tl.width,
        height: tl.height,
      };
    }}
  />
);
