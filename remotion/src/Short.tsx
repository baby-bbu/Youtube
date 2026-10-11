import { getAudioData } from '@remotion/media-utils';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from 'remotion';
import { loudnessAtFrame, loudnessSeries } from './Audio/loudness';
import { Captions } from './Captions/Captions';
import { captionGroups } from './Captions/groupWords';
import { Guy } from './Guy/Guy';
import { GUY_SCALE, guyLayout } from './Guy/layout';
import { guyPose } from './Guy/motion';
import { Label } from './Scene/Label';
import { Scene } from './Scene/Scene';
import { slideOffset, transitionFrames } from './Scene/transitions';
import { parseTimeline, shotAt } from './timeline';
import type { Timeline, Transition } from './types';

const LABEL_SECONDS = 1.0;

function incomingStyle(kind: Transition, p: number, width: number): CSSProperties {
  switch (kind) {
    case 'slide-left':
      return { transform: `translateX(${slideOffset(p, 'left', width)}px)` };
    case 'slide-right':
      return { transform: `translateX(${slideOffset(p, 'right', width)}px)` };
    case 'whip':
      return {
        transform: `translateX(${slideOffset(p, 'left', width)}px)`,
        filter: `blur(${(1 - p) * 14}px)`,
      };
    case 'zoom':
      return { transform: `scale(${1.2 - 0.2 * p})` };
    default:
      return {};
  }
}

/** The whole short: scenes, label, the Rundown Guy, captions and the voice track. */
export const Short: React.FC<Timeline> = (rawProps) => {
  const tl = useMemo(() => parseTimeline(rawProps), [rawProps]);
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = frame / fps;

  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender('Loading the voice for mouth movement'));
  const [series, setSeries] = useState<number[]>([]);
  useEffect(() => {
    getAudioData(staticFile(tl.voice))
      .then((data) => {
        setSeries(loudnessSeries(data.channelWaveforms[0], data.sampleRate, tl.fps, tl.duration));
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [tl, handle, continueRender, cancelRender]);

  const groups = useMemo(() => captionGroups(tl), [tl]);

  const shot = shotAt(tl, t);
  const index = tl.shots.indexOf(shot);
  const shotSeconds = shot.end - shot.start;
  const progress = Math.min(1, Math.max(0, (t - shot.start) / shotSeconds));
  const framesIntoShot = frame - Math.round(shot.start * fps);
  const transFrames = transitionFrames(shot.transition, fps, Math.round(shotSeconds * fps));
  const transitioning = index > 0 && transFrames > 0 && framesIntoShot >= 0 && framesIntoShot < transFrames;

  const pose = guyPose(tl, t, loudnessAtFrame(series, frame));
  const guy = guyLayout(pose.x, GUY_SCALE, width);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0F0F0F' }}>
      <Audio src={staticFile(tl.voice)} />
      {transitioning && <Scene shot={tl.shots[index - 1]} progress={1} />}
      <AbsoluteFill
        style={transitioning ? incomingStyle(shot.transition, framesIntoShot / transFrames, width) : {}}
      >
        <Scene shot={shot} progress={progress} />
      </AbsoluteFill>
      {shot.label && t - shot.start < LABEL_SECONDS && <Label text={shot.label} />}
      <div style={{ position: 'absolute', left: guy.left, top: guy.top }}>
        <Guy pose={pose} sticker scale={GUY_SCALE} />
      </div>
      <Captions groups={groups} frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};
