export const COLORS = {
  yellow: '#FFD400',
  black: '#0F0F0F',
  ink: '#111111',
  white: '#FFFFFF',
} as const;

// One constant so the caption font can be swapped later (see brand/brand.md).
export const CAPTION_FONT = 'Inter';

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

/**
 * Margins kept clear so ONE master file works on YouTube Shorts, TikTok and Instagram
 * Reels. A conservative union of the apps' on-screen UI (buttons, captions, progress
 * bars). These are approximations from public guides, not official specs; check each
 * app's live preview before publishing.
 */
export const SAFE_ZONE = { top: 250, bottom: 300, left: 90, right: 180 } as const;

export function safeBox(width: number = VIDEO.width, height: number = VIDEO.height) {
  return {
    x: SAFE_ZONE.left,
    y: SAFE_ZONE.top,
    width: width - SAFE_ZONE.left - SAFE_ZONE.right,
    height: height - SAFE_ZONE.top - SAFE_ZONE.bottom,
  };
}

/** Where captions live: the safe box's full width, bottom edge 60 px inside the safe box. */
export const CAPTION_BOX = {
  left: SAFE_ZONE.left,
  width: VIDEO.width - SAFE_ZONE.left - SAFE_ZONE.right,
  bottomY: VIDEO.height - SAFE_ZONE.bottom - 60,
} as const;
