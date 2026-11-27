import { CSS_PIXELS_PER_INCH } from "@/_lib/pixels-per-inch";

/**
 * SVG sizes without units (e.g. width="612", or width="100%" with a viewBox)
 * are pixels, but the file doesn't say how many pixels make an inch.
 * The SVG standard says 96. Affinity exports at the document's DPI, 72 by default.
 */
export const SVG_DPI_OPTIONS = [72, 96, 300];
export const STANDARD_DPI = CSS_PIXELS_PER_INCH;
const AFFINITY_DPI = 72;

// CSS pixels per unit.
const PX_PER_UNIT: Record<string, number> = {
  px: 1,
  in: CSS_PIXELS_PER_INCH,
  cm: CSS_PIXELS_PER_INCH / 2.54,
  mm: CSS_PIXELS_PER_INCH / 25.4,
  q: CSS_PIXELS_PER_INCH / 101.6,
  pt: CSS_PIXELS_PER_INCH / 72,
  pc: CSS_PIXELS_PER_INCH / 6,
};

export interface SvgLength {
  value: number;
  unit: string; // lowercase; "" when unitless
}

export interface SvgSizeAttributes {
  width: string | null;
  height: string | null;
  viewBox: string | null;
}

export interface SvgSize {
  /** Size in CSS pixels (96 per inch). */
  width: number;
  height: number;
  /** viewBox to add when the file has none, so its content scales with the new size. */
  viewBox: string | null;
}

export function parseSvgLength(raw: string | null): SvgLength | null {
  const match = raw
    ?.trim()
    .match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*([a-z%]*)$/i);
  if (!match) return null;
  return { value: Number(match[1]), unit: match[2].toLowerCase() };
}

export function parseViewBox(raw: string | null): number[] | null {
  const parts = raw
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);
  if (!parts || parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    return null;
  }
  return parts[2] > 0 && parts[3] > 0 ? parts : null;
}

/** Absolute lengths in CSS pixels, or null for unitless, relative or invalid ones. */
function absolutePx(length: SvgLength | null): number | null {
  if (!length || length.value <= 0 || !(length.unit in PX_PER_UNIT)) {
    return null;
  }
  return length.value * PX_PER_UNIT[length.unit];
}

/** True when the SVG's physical size depends on a DPI the file doesn't state. */
export function svgSizeNeedsDpi(attrs: SvgSizeAttributes): boolean {
  const width = absolutePx(parseSvgLength(attrs.width));
  const height = absolutePx(parseSvgLength(attrs.height));
  return width === null && height === null;
}

/** Best guess at the DPI an SVG was exported at. */
export function guessSvgDpi(svg: SVGSVGElement): number {
  const fromAffinity = Array.from(svg.attributes).some((a) =>
    /^https?:\/\/www\.serif\.com\/?$/.test(a.value),
  );
  return fromAffinity ? AFFINITY_DPI : STANDARD_DPI;
}

/**
 * The SVG's size in CSS pixels, reading unitless numbers at `dpi`.
 * Returns null when there isn't enough information to size it.
 */
export function getSvgSize(
  attrs: SvgSizeAttributes,
  dpi: number,
): SvgSize | null {
  const pxPerUnitless = STANDARD_DPI / dpi;
  const widthLength = parseSvgLength(attrs.width);
  const heightLength = parseSvgLength(attrs.height);
  const viewBox = parseViewBox(attrs.viewBox);

  const toPx = (length: SvgLength | null) =>
    length?.unit === "" && length.value > 0
      ? length.value * pxPerUnitless
      : absolutePx(length);

  let width = toPx(widthLength);
  let height = toPx(heightLength);

  // Missing or relative (e.g. "100%") sides come from the viewBox.
  if (viewBox) {
    const [, , vbWidth, vbHeight] = viewBox;
    if (width === null && height === null) {
      width = vbWidth * pxPerUnitless;
      height = vbHeight * pxPerUnitless;
    } else if (width === null) {
      width = height! * (vbWidth / vbHeight);
    } else if (height === null) {
      height = width * (vbHeight / vbWidth);
    }
  }
  if (width === null || height === null) return null;

  // Without a viewBox, the content is drawn in the original width/height as
  // pixels. Add a viewBox with those numbers so it scales to the new size.
  let newViewBox: string | null = null;
  if (!viewBox) {
    const originalWidth =
      widthLength && (absolutePx(widthLength) ?? widthLength.value);
    const originalHeight =
      heightLength && (absolutePx(heightLength) ?? heightLength.value);
    if (!originalWidth || !originalHeight) return null;
    newViewBox = `0 0 ${originalWidth} ${originalHeight}`;
  }

  return { width, height, viewBox: newViewBox };
}

/** The root <svg>'s size attributes as exported, before applySvgSize changed them. */
export function getOriginalSvgSizeAttributes(
  svg: SVGSVGElement,
): SvgSizeAttributes {
  if (svg.dataset.originalSize === undefined) {
    svg.dataset.originalSize = JSON.stringify({
      width: svg.getAttribute("width"),
      height: svg.getAttribute("height"),
      viewBox: svg.getAttribute("viewBox"),
    });
  }
  return JSON.parse(svg.dataset.originalSize);
}

/** Resize the root <svg> so the browser draws it at its physical size. */
export function applySvgSize(svg: SVGSVGElement, dpi: number): void {
  const original = getOriginalSvgSizeAttributes(svg);
  const size = getSvgSize(original, dpi);
  if (!size) return;
  svg.setAttribute("viewBox", size.viewBox ?? original.viewBox!);
  svg.setAttribute("width", String(size.width));
  svg.setAttribute("height", String(size.height));
}
