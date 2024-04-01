import { CM, getPtDensity } from "@/_lib/unit";
import Matrix from "ml-matrix";
import { Point } from "@/_lib/point";
import { DisplaySettings } from "@/_lib/display-settings";
import {
  checkIsConcave, rectCorners, transformPoint, transformPoints, translatePoints
} from "@/_lib/geometry";

export class CanvasState {
  isConcave: boolean = false;

  lightColor: string = "#fff";
  darkColor: string = "#000";
  greenColor: string = "#32CD32" 
  bgColor: string = "#fff";
  fillColor: string = "#000";
  gridLineColor: string = "#fff";
  projectionGridLineColor: string = "#fff";
  majorLineWidth: number = 2;
  minorLineWidth: number = 1;

  constructor(
    public ctx: CanvasRenderingContext2D,
    public offset: Point = { x: 0, y: 0 },
    public points: Point[],
    public width: number,
    public height: number,
    public perspective: Matrix,
    public isCalibrating: boolean,
    public corners: Set<number>,
    public unitOfMeasure: string,
    public isPrecisionMovement: boolean,
    public errorFillPattern: CanvasPattern,
    public transitionProgress: number,
    public displaySettings: DisplaySettings,
  ) {
    this.isConcave = checkIsConcave(this.points);
  }
}

export enum OverlayMode {
  GRID,
  BORDER,
  PAPER,
  NONE,
}

/* Creates a checkerboard pattern for the canvas context */
export function createCheckerboardPattern(
  ctx: CanvasRenderingContext2D,
  size: number = 3,
  color1: string = "black",
  color2: string = "#CCC"
  ): CanvasPattern {
  /* We first create a new canvas on which to draw the pattern */
  const patternCanvas = document.createElement('canvas');
  try {
    const patternCtx = patternCanvas.getContext('2d');

    if (!patternCtx) {
      throw new Error('Failed to get 2D context from pattern canvas');
    }
  
    /* Integer which defines the size of a checkerboard square (in pixels) */
    size = Math.round(size)

    patternCanvas.width = size*2;
    patternCanvas.height = size*2;

    /* Draw the checkerboard pattern */
    patternCtx.fillStyle = color1;
    patternCtx.fillRect(0, 0, size, size);
    patternCtx.fillRect(size, size, size, size);
    patternCtx.fillStyle = color2;
    patternCtx.fillRect(size, 0, size, size);
    patternCtx.fillRect(0, size, size, size);

    /* Create the pattern from the canvas */
    const pattern = ctx.createPattern(patternCanvas, 'repeat');

    if (!pattern) {
      throw new Error('Failed to create pattern from canvas');
    }

    return pattern;
  } finally {
    /* Clean up the dynamically created canvas element */
    patternCanvas.remove();
  }
}

/* Interpolates between the colors in the given array based on "value".
 * "value" should be a number between zero and len(colors). */
export function interpolateColorRing(colors: string[], value: number, useEaseInOut: boolean = true): string {
  const len = colors.length;
  
  // Normalize the value to be between 0 and len
  const normalizedValue = ((value % len) + len) % len;
  
  // Find the indices of the two colors to interpolate between
  const startIndex = Math.floor(normalizedValue);
  const endIndex = (startIndex + 1) % len;
  
  // Calculate the portion for interpolation
  let portion = normalizedValue - startIndex;

  // Apply the easing function if set
  if (useEaseInOut) {
    portion = easeInOut(portion);
  }  
  // Get the start and end colors
  const startColor = colors[startIndex];
  const endColor = colors[endIndex];
  
  // Interpolate between the start and end colors using the interpolateColors function
  return interpolateColor(startColor, endColor, portion);
}

/* Reworked from https://github.com/thednp/bezier-easing */
export function cubicBezierTiming(t: number, x1?: number, y1?: number, x2?: number, y2?: number): number {
  const p1x = x1 || 0;
  const p1y = y1 || 0;
  const p2x = x2 || 1;
  const p2y = y2 || 1;
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  const sampleCurveY = (t: number): number => {
    return ((ay * t + by) * t + cy) * t;
  }

  const sampleCurveX = (t: number): number => {
    return ((ax * t + bx) * t + cx) * t;
  }
  
  const sampleCurveDerivativeX = (t: number): number => {
    return (3 * ax * t + 2 * bx) * t + cx;
  }
  
  const solveCurveX = (x: number): number => {
    // Set Precision
    const epsilon = 1e-6;

    // Skip values out of range
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    let t2 = x;
    let x2 = 0;
    let d2 = 0;

    // First try a few iterations of Newton's method
    // -- usually very fast.
    for (let i = 0; i < 8; i += 1) {
      x2 = sampleCurveX(t2) - x;
      if (Math.abs(x2) < epsilon) return t2;
      d2 = sampleCurveDerivativeX(t2);
      /* istanbul ignore next */
      if (Math.abs(d2) < epsilon) break;
      t2 -= x2 / d2;
    }

    // No solution found - use bi-section
    let t0 = 0;
    let t1 = 1;
    t2 = x;

    while (t0 < t1) {
      x2 = sampleCurveX(t2);
      if (Math.abs(x2 - x) < epsilon) return t2;
      if (x > x2) t0 = t2;
      else t1 = t2;

      t2 = (t1 - t0) * 0.5 + t0;
    }

    // Give up
    /* istanbul ignore next */
    return t2;
  }

  return sampleCurveY(solveCurveX(t));
}

/* Equivalent to cubic-bezier(0.4, 0, 0.2, 1) */
function easeInOut(t: number): number {
  return cubicBezierTiming(t, 0.4, 0, 0.2, 1);
}

/* Interpolates between two colors given 'portion', a number between 0 and 1.
 * Acceptable formats: #rgb #rrggbb rgba(r,g,b) rgba(r,g,b,a) */
export function interpolateColor(color1: string, color2: string, portion: number): string {
  // Helper function to parse color components from a string
  const parseColor = (color: string): number[] => {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return hex.split('').map(c => parseInt(c.repeat(2), 16) / 255);
      } else if (hex.length === 6) {
        return [
          parseInt(hex.slice(0, 2), 16) / 255,
          parseInt(hex.slice(2, 4), 16) / 255,
          parseInt(hex.slice(4, 6), 16) / 255
        ];
      }
    } else if (color.startsWith('rgb')) {
      const components = color.match(/[\d.]+/g)?.map(parseFloat) || [];
      if (components.length === 3 || components.length === 4) {
        return components.slice(0, 3);
      }
    }
    throw new Error('Invalid color format');
  };

  // Helper function to convert RGB components to a hex string
  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (value: number) => {
      const hex = Math.round(value * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b);
  };

  const [r1, g1, b1] = parseColor(color1);
  const [r2, g2, b2] = parseColor(color2);

  const r = r1 + (r2 - r1) * portion;
  const g = g1 + (g2 - g1) * portion;
  const b = b1 + (b2 - b1) * portion;

  if (color1.startsWith('#') && color1.length === 4) {
    return rgbToHex(r, g, b);
  } else if (color1.startsWith('#')) {
    return '#' + [r, g, b].map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('');
  } else if (color1.startsWith('rgba')) {
    const a1 = parseFloat(color1.match(/[\d.]+/g)?.[3] || '1');
    const a2 = parseFloat(color2.match(/[\d.]+/g)?.[3] || '1');
    const a = a1 + (a2 - a1) * portion;
    return `rgba(${r},${g},${b},${a})`;
  } else {
    return `rgb(${r},${g},${b})`;
  }
}

export function drawLine(
  ctx: CanvasRenderingContext2D,
  p1: Point,
  p2: Point,
  lineWidth: number = 1,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.lineWidth = lineWidth;
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  ctx.restore();
}

export function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  fillStyle?: string | null | CanvasPattern,
  strokeStyle?: string | null,
): void {
  ctx.beginPath();
  for (let p of points) {
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  if (fillStyle !== undefined && fillStyle !== null) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle !== undefined && strokeStyle !== null) {
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }
}

export function drawOverlays(cs: CanvasState) {
  const { grid, border, paper, fliplines } = cs.displaySettings.overlay;
  const ctx = cs.ctx;
  if (grid) {
    ctx.strokeStyle = cs.projectionGridLineColor;
    drawGrid(cs, 8, [1]);
  }
  if (border) {
    drawBorder(cs, cs.darkColor, cs.gridLineColor);
  }
  if (paper) {
    drawPaperSheet(cs);
  }
  if (fliplines) {
    drawCenterLines(cs);
  }
}

export function drawCenterLines(cs: CanvasState) {
  const { width, height, ctx, perspective } = cs;
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "red";

  function drawProjectedLine(p1: Point, p2: Point) {
    const pts = transformPoints([p1, p2], perspective);
    const lineWidth = 2;
    drawLine(ctx, pts[0], pts[1], lineWidth);
    ctx.stroke();
  }

  // X-axis
  drawProjectedLine({ x: 0, y: height * 0.5 }, { x: width, y: height * 0.5 });
  drawProjectedLine({ x: width * 0.5, y: 0 }, { x: width * 0.5, y: height });

  ctx.restore();
}

export function drawPaperSheet(cs: CanvasState) {
  const { ctx, perspective, unitOfMeasure, width, height } = cs;
  const fontSize = 32;

  ctx.save();
  ctx.globalCompositeOperation = "difference";
  ctx.font = `${fontSize}px monospace`;
  ctx.fillStyle = "white";

  const [text, paperWidth, paperHeight] =
    unitOfMeasure == CM ? ["A4", 29.7, 21] : ["11x8.5", 11, 8.5];

  const cornersP = transformPoints(
    translatePoints(
      rectCorners(paperWidth, paperHeight),
      (width - paperWidth) * 0.5,
      (height - paperHeight) * 0.5,
    ),
    perspective,
  );
  drawPolygon(ctx, cornersP);
  ctx.setLineDash([4, 2]);
  ctx.lineWidth = 4;
  ctx.strokeStyle = cs.projectionGridLineColor;
  ctx.stroke();

  const labelWidth = ctx.measureText(text).width;
  ctx.textBaseline = "middle";
  ctx.fillStyle = cs.projectionGridLineColor;
  const centerP = transformPoint(
    {
      x: width * 0.5,
      y: height * 0.5,
    },
    perspective,
  );
  ctx.fillText(text, centerP.x - labelWidth * 0.5, centerP.y);
  ctx.restore();
}

export function drawBorder(cs: CanvasState, lineColor: string, dashColor: string) {
  const ctx = cs.ctx;
  ctx.save();
  drawPolygon(ctx, cs.points);
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.lineDashOffset = 0;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = dashColor;
  ctx.stroke();
  ctx.restore();
}

export function drawGrid(cs: CanvasState, outset: number, lineDash?: number[]): void {
  const ctx = cs.ctx;
  ctx.save();
  if (lineDash === undefined) {
    ctx.setLineDash([]);
  } else {
    ctx.setLineDash(lineDash);
  }
  ctx.globalCompositeOperation = "source-over";
  const majorLine = 5;

  /* Vertical lines */
  for (let i = 0; i <= cs.width; i++) {
    let lineWidth = cs.minorLineWidth;
    if (i % majorLine === 0 || i === cs.width) {
      lineWidth = cs.majorLineWidth;
    }
    const line = transformPoints(
      [
        { x: i, y: -outset },
        { x: i, y: cs.height + outset },
      ],
      cs.perspective,
    );
    drawLine(ctx, line[0], line[1], lineWidth);
  }

  /* Horizontal lines */
  for (let i = 0; i <= cs.height; i++) {
    let lineWidth = cs.minorLineWidth;
    if (i % majorLine === 0 || i === cs.height) {
      lineWidth = cs.majorLineWidth;
    }
    const y = cs.height - i;
    const line = transformPoints(
      [
        { x: -outset, y: y },
        { x: cs.width + outset, y: y },
      ],
      cs.perspective,
    );
    drawLine(ctx, line[0], line[1], lineWidth);
  }
  if (cs.isCalibrating) {
    drawDimensionLabels(
      ctx,
      cs.width,
      cs.height,
      cs.perspective,
      cs.unitOfMeasure,
    );
  }
  ctx.restore();
}

export function drawDimensionLabels(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  perspective: Matrix,
  unitOfMeasure: string,
) {
  const fontSize = 48;
  const inset = 20;
  ctx.globalCompositeOperation = "difference";
  ctx.font = `${fontSize}px monospace`;
  ctx.fillStyle = "white";
  const widthText = `${width}${unitOfMeasure.toLocaleLowerCase()}`;
  const heightText = `${height}${unitOfMeasure.toLocaleLowerCase()}`;
  const line = transformPoints(
    [
      {
        x: width * 0.5,
        y: height,
      },
      {
        x: 0,
        y: height * 0.5,
      },
    ],
    perspective,
  );
  const widthLabelWidth = ctx.measureText(widthText).width;
  ctx.fillText(widthText, line[0].x - widthLabelWidth * 0.5, line[0].y - inset);
  ctx.fillText(heightText, line[1].x + inset, line[1].y + fontSize * 0.5);
}

export function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  point: Point,
  size: number,
) {
  const halfSize = size / 2;
  ctx.beginPath();
  ctx.moveTo(point.x - halfSize, point.y);
  ctx.lineTo(point.x + halfSize, point.y);
  ctx.moveTo(point.x, point.y - halfSize);
  ctx.lineTo(point.x, point.y + halfSize);
}
