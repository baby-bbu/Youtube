const MIN_FONT_PX = 40;
/** Rough average glyph width as a fraction of the font size for bold rounded text. */
const AVG_GLYPH_WIDTH = 0.55;

/** Largest font size (up to basePx) at which the text should fit within maxWidthPx. */
export function fitFontSize(text: string, maxWidthPx: number, basePx: number): number {
  const estimated = text.length * basePx * AVG_GLYPH_WIDTH;
  if (estimated <= maxWidthPx) return basePx;
  return Math.max(MIN_FONT_PX, Math.floor((basePx * maxWidthPx) / estimated));
}
