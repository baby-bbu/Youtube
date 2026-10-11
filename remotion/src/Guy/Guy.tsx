import { COLORS } from '../brand';
import type { GuyPose } from '../types';
import { MOUTH_PATHS } from './mouths';

const CAP_FILL = '#161616';

export type GuyProps = {
  pose: GuyPose;
  /** White sticker outline, used over images. */
  sticker?: boolean;
  scale?: number;
};

/**
 * The Rundown Guy, drawn from the parts in brand/character/rundown-guy.svg
 * (400x520 canvas, head centre (200,210) radius 100). Horizontal placement on the
 * frame (pose.x) is the caller's job; this draws the character itself.
 */
export function Guy({ pose, sticker = false, scale = 1 }: GuyProps) {
  const ink = COLORS.ink;
  return (
    <svg
      width={400 * scale}
      height={450 * scale}
      viewBox="0 70 400 450"
      style={{ overflow: 'visible' }}
    >
      {sticker && (
        <defs>
          <filter id="guy-sticker" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="8" result="d" />
            <feFlood floodColor={COLORS.white} />
            <feComposite in2="d" operator="in" result="w" />
            <feMerge>
              <feMergeNode in="w" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      <g
        transform={`translate(0,${-pose.bob})`}
        filter={sticker ? 'url(#guy-sticker)' : undefined}
      >
        <g id="body" stroke={ink} strokeWidth={16} strokeLinecap="round" fill="none">
          <line x1="200" y1="312" x2="200" y2="404" />
          <line
            id="arm-left"
            x1="200"
            y1="338"
            x2="150"
            y2="378"
            transform={`rotate(${pose.leftArm} 200 338)`}
          />
          <line
            id="arm-right"
            x1="200"
            y1="338"
            x2="250"
            y2="378"
            transform={`rotate(${pose.rightArm} 200 338)`}
          />
          <line x1="200" y1="404" x2="172" y2="476" />
          <line x1="200" y1="404" x2="228" y2="476" />
        </g>
        <g id="head" transform={`rotate(${pose.tilt} 200 210)`}>
          <circle cx="200" cy="210" r="100" fill={COLORS.white} stroke={ink} strokeWidth={7} />
          <g id="face" transform={`translate(${pose.faceX},0)`}>
            <rect x="132" y="198" width="66" height="40" rx="17" fill={ink} />
            <rect x="214" y="198" width="66" height="40" rx="17" fill={ink} />
            <rect x="196" y="208" width="20" height="9" fill={ink} />
            <g
              id="mouth"
              transform="translate(206,268) scale(0.92,0.92)"
              dangerouslySetInnerHTML={{ __html: MOUTH_PATHS[pose.mouth] }}
            />
          </g>
          <g id="cap">
            <path
              d="M106 172 C100 108 150 94 200 94 C250 94 300 108 294 172 C250 184 150 184 106 172 Z"
              fill={CAP_FILL}
              stroke="#000"
              strokeWidth={7}
              strokeLinejoin="round"
            />
            <circle cx="200" cy="96" r="7" fill={CAP_FILL} stroke="#000" strokeWidth={5} />
            <path d="M112 170 C150 182 250 182 288 170" stroke="#3a3a3a" strokeWidth={5} fill="none" />
            <rect
              x="184"
              y="170"
              width="32"
              height="14"
              rx="4"
              fill="#2e2e2e"
              stroke="#000"
              strokeWidth={4}
            />
          </g>
        </g>
      </g>
    </svg>
  );
}
