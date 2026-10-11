export const GUY_SCALE = 1.7;
export const GUY_TOP = 760;

/** The drawing is 400 wide; the head circle spans x 100..300 and the feet end 414 down. */
const SVG_WIDTH = 400;
const HEAD_LEFT = 100;
const HEAD_RIGHT = 300;
const FEET_BOTTOM = 414;

/**
 * Where the character is drawn. x is the pose's -1..1 position across the frame.
 * headLeft/headRight/bottom are the visible extents, used to keep him inside the
 * platform-safe area.
 */
export function guyLayout(x: number, scale: number, frameWidth: number) {
  const left = frameWidth / 2 - (SVG_WIDTH * scale) / 2 + x * (frameWidth / 2);
  return {
    left,
    top: GUY_TOP,
    headLeft: left + HEAD_LEFT * scale,
    headRight: left + HEAD_RIGHT * scale,
    bottom: GUY_TOP + FEET_BOTTOM * scale,
  };
}
