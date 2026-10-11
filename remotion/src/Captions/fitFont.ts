const MIN_FONT_PX = 40;
/** Rough glyph widths (as a fraction of the font size) for the bold rounded caption font. */
const LOWERCASE_WIDTH = 0.55;
const CAPITAL_WIDTH = 0.78;

const estimatedWidth = (text: string, fontPx: number) =>
  [...text].reduce((sum, ch) => sum + (/[A-Z0-9]/.test(ch) ? CAPITAL_WIDTH : LOWERCASE_WIDTH), 0) *
  fontPx;

/** Largest font size (up to basePx) at which the text should fit within maxWidthPx. */
export function fitFontSize(text: string, maxWidthPx: number, basePx: number): number {
  const estimated = estimatedWidth(text, basePx);
  if (estimated <= maxWidthPx) return basePx;
  return Math.max(MIN_FONT_PX, Math.floor((basePx * maxWidthPx) / estimated));
}
