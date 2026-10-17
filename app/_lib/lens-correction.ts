import { Point } from "@/_lib/point";

/**
 * Projector lens (barrel / pincushion) correction.
 *
 * Projector lenses, especially on short-throw and budget projectors, bend straight lines near the edges of the
 * image. The perspective calibration can only correct keystone, because a homography always maps straight lines to
 * straight lines, so this correction is applied as a separate screen-space warp after everything else is drawn.
 *
 * It uses a one-term radial model centred on the screen: the pixel at p shows the content at
 *
 *   q = c + (p - c) * (1 + k1 * r²)
 *
 * where c is the centre of the screen and r is the distance from c normalised so that r = 1 at the corners.
 * A positive k1 pulls the edges of the content inwards, which cancels barrel distortion. A negative k1 pushes them
 * outwards, which cancels pincushion distortion.
 */
export interface LensCorrection {
  /** Radial coefficient as a percentage, e.g. 2 means the corners move by 2% of the half diagonal. */
  strength: number;
}

export const maxLensCorrectionStrength = 30;

export function getDefaultLensCorrection(): LensCorrection {
  return { strength: 0 };
}

export function isLensCorrectionActive(lensCorrection: LensCorrection) {
  return lensCorrection.strength !== 0;
}

export function clampLensCorrectionStrength(strength: number): number {
  if (!Number.isFinite(strength)) {
    return 0;
  }
  return Math.max(
    -maxLensCorrectionStrength,
    Math.min(maxLensCorrectionStrength, strength),
  );
}

function k1(lensCorrection: LensCorrection) {
  return lensCorrection.strength / 100;
}

/**
 * Returns the point in the undistorted content that is shown at screen point p.
 * Use this to convert pointer positions on the corrected screen back to content coordinates.
 */
export function lensSourcePoint(
  p: Point,
  width: number,
  height: number,
  lensCorrection: LensCorrection,
): Point {
  const cx = width / 2;
  const cy = height / 2;
  const halfDiagonalSquared = cx * cx + cy * cy;
  if (halfDiagonalSquared === 0) {
    return p;
  }
  const dx = p.x - cx;
  const dy = p.y - cy;
  const r2 = (dx * dx + dy * dy) / halfDiagonalSquared;
  const f = 1 + k1(lensCorrection) * r2;
  return { x: cx + dx * f, y: cy + dy * f };
}

/**
 * Returns the screen point where content point q appears, the inverse of lensSourcePoint.
 * Solves s * (1 + k1 * s²) = u for the normalised screen radius s with Newton's method.
 */
export function lensDisplayPoint(
  q: Point,
  width: number,
  height: number,
  lensCorrection: LensCorrection,
): Point {
  const k = k1(lensCorrection);
  const cx = width / 2;
  const cy = height / 2;
  const halfDiagonal = Math.hypot(cx, cy);
  const dx = q.x - cx;
  const dy = q.y - cy;
  const u = Math.hypot(dx, dy) / (halfDiagonal || 1);
  if (k === 0 || u === 0) {
    return q;
  }
  let s = u;
  for (let i = 0; i < 20; i++) {
    const f = s * (1 + k * s * s) - u;
    const df = 1 + 3 * k * s * s;
    if (df <= 0) break;
    const next = s - f / df;
    if (Math.abs(next - s) < 1e-12) {
      s = next;
      break;
    }
    s = next;
  }
  const ratio = s / u;
  return { x: cx + dx * ratio, y: cy + dy * ratio };
}

/**
 * Moves calibration points so that they stay at the same place on screen when the lens correction changes.
 * This way adjusting the lens only bends the lines between the corners and never undoes the corner calibration.
 */
export function keepPointsInPlace(
  points: Point[],
  width: number,
  height: number,
  from: LensCorrection,
  to: LensCorrection,
): Point[] {
  return points.map((p) =>
    lensSourcePoint(
      lensDisplayPoint(p, width, height, from),
      width,
      height,
      to,
    ),
  );
}

/** Largest displacement in pixels along one axis, which occurs at the corners. */
export function maxLensDisplacement(
  width: number,
  height: number,
  lensCorrection: LensCorrection,
): number {
  return (Math.abs(k1(lensCorrection)) * Math.max(width, height)) / 2;
}

export interface DisplacementMap {
  width: number;
  height: number;
  /** RGBA pixels: red is the horizontal displacement, green the vertical one. */
  data: Uint8ClampedArray;
  /** Value for the scale attribute of feDisplacementMap. */
  scale: number;
}

/**
 * Builds an image for an SVG feDisplacementMap that applies the lens correction.
 *
 * feDisplacementMap draws the output pixel at p from the input at
 *   p + scale * (channel / 255 - 0.5)
 * so each displacement is encoded around the middle value of its channel.
 */
export function createDisplacementMap(
  width: number,
  height: number,
  lensCorrection: LensCorrection,
): DisplacementMap {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  // A small margin keeps the corner values inside the channel's range after rounding.
  const scale = Math.max(1, 2 * maxLensDisplacement(w, h, lensCorrection) + 2);
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Sample at the pixel centre
      const p = { x: x + 0.5, y: y + 0.5 };
      const q = lensSourcePoint(p, w, h, lensCorrection);
      const i = (y * w + x) * 4;
      data[i] = Math.round(((q.x - p.x) / scale + 0.5) * 255);
      data[i + 1] = Math.round(((q.y - p.y) / scale + 0.5) * 255);
      data[i + 2] = 0;
      data[i + 3] = 255;
    }
  }
  return { width: w, height: h, data, scale };
}

/** Decodes the displacement stored at pixel (x, y), mirroring what feDisplacementMap does. */
export function decodeDisplacement(map: DisplacementMap, x: number, y: number) {
  const i = (y * map.width + x) * 4;
  return {
    x: map.scale * (map.data[i] / 255 - 0.5),
    y: map.scale * (map.data[i + 1] / 255 - 0.5),
  };
}

export function parseLensCorrection(value: unknown): LensCorrection {
  if (
    typeof value === "object" &&
    value !== null &&
    "strength" in value &&
    typeof value.strength === "number"
  ) {
    return { strength: clampLensCorrectionStrength(value.strength) };
  }
  return getDefaultLensCorrection();
}
