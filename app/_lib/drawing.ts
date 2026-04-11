import { Unit } from "@/_lib/unit";
import Matrix from "ml-matrix";
import { Point } from "@/_lib/point";
import {
  DisplaySettings,
  fillColor,
  strokeColor,
} from "@/_lib/display-settings";
import {
  RestoreTransforms,
  SimpleLine,
  checkIsConcave,
  rectCorners,
  transformPoint,
  transformPoints,
  transformSimpleLine,
  translatePoints,
} from "@/_lib/geometry";

export class CanvasState {
  isConcave: boolean = false;
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
    public hoverCorners: Set<number>,
    public unitOfMeasure: Unit,
    public errorFillPattern: CanvasFillStrokeStyles["fillStyle"],
    public displaySettings: DisplaySettings,
    public isFlipped: boolean,
    public calibrationTransform: Matrix,
    public zoomedOut: boolean,
    public magnifying: boolean,
    public restoreTransforms: RestoreTransforms | null,
    public t: any,
    public patternScale: string | null,
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

export function drawLine(
  ctx: CanvasRenderingContext2D,
  line: SimpleLine,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(line[0].x, line[0].y);
  ctx.lineTo(line[1].x, line[1].y);
  ctx.stroke();
  ctx.restore();
}

export function drawCircle(
  ctx: CanvasRenderingContext2D,
  p: Point,
  radius: number,
) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
  ctx.stroke();
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  line: SimpleLine,
): void {
  const dx = line[1].x - line[0].x;
  const dy = line[1].y - line[0].y;
  const angle = Math.atan2(dy, dx);
  const length = Math.hypot(dy, dx);
  const arrowLength = 16;
  const arrowWidth = 8;
  const whisker = 16;
  ctx.save();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.translate(line[1].x, line[1].y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(-ctx.lineWidth / 2, 0);
  ctx.lineTo(-arrowLength, arrowWidth);
  ctx.lineTo(-arrowLength, -arrowWidth);
  ctx.closePath();
  ctx.fill();
  ctx.moveTo(-arrowLength, 0);
  ctx.lineTo(-length, 0);
  ctx.moveTo(0, whisker);
  ctx.lineTo(0, -whisker);
  ctx.moveTo(-length, -whisker);
  ctx.lineTo(-length, whisker);
  ctx.stroke();
  ctx.restore();
}

export function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: Point[],
): void {
  ctx.beginPath();
  for (const p of points) {
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
}

export function drawOverlays(cs: CanvasState) {
  const {
    ctx,
    displaySettings,
    zoomedOut,
    t,
    magnifying,
    restoreTransforms,
    patternScale,
  } = cs;
  const { grid, border, paper, flipLines, flippedPattern, disabled } =
    displaySettings.overlay;
  const { theme } = displaySettings;

  if (disabled) {
    return;
  }

  ctx.strokeStyle = strokeColor(theme);
  if (zoomedOut) {
    drawMessage(cs, t("zoomedOut"));
    drawViewportOutline(cs);
  } else if (magnifying && restoreTransforms !== null) {
    drawMessage(cs, t("magnifying"));
  } else {
    if (grid) {
      drawGrid(cs, 8, [1]);
    }
    if (border) {
      drawBorder(cs, strokeColor(theme), fillColor(theme));
    }
    if (paper) {
      ctx.strokeStyle = "black";
      drawPaperSheet(cs);
    }
    if (flipLines) {
      drawCenterLines(cs);
    }
    if (flippedPattern && cs.isFlipped) {
      drawFlippedPattern(cs);
    }
    if (patternScale && Number(patternScale) !== 1) {
      drawMessage(
        cs,
        t.rich("scaled", {
          scale: () => String(Number(patternScale).toFixed(2)),
        }),
      );
    }
  }
}

function drawMessage(cs: CanvasState, message: string) {
  const { ctx, width, perspective } = cs;
  ctx.save();
  ctx.fillStyle = "#9333ea";
  ctx.font = "48px sans-serif";
  const text = message;
  const textWidth = ctx.measureText(text).width;
  const center = transformPoint(
    {
      x: width * 0.5,
      y: 0,
    },
    perspective,
  );
  ctx.fillText(text, center.x - textWidth * 0.5, center.y);
  ctx.restore();
}

function drawViewportOutline(cs: CanvasState) {
  const { ctx, calibrationTransform, restoreTransforms } = cs;
  ctx.save();
  ctx.strokeStyle = "#9333ea";
  ctx.lineWidth = 2;
  let corners = transformPoints(
    rectCorners(window.innerWidth, window.innerHeight),
    calibrationTransform,
  );
  if (restoreTransforms !== null) {
    const x = restoreTransforms.localTransform.get(0, 2);
    const y = restoreTransforms.localTransform.get(1, 2);
    const s = calibrationTransform.get(0, 0);
    corners = translatePoints(corners, Math.abs(x) * s, Math.abs(y) * s);
    drawPolygon(ctx, corners);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawCenterLines(cs: CanvasState) {
  const { width, height, ctx, perspective } = cs;
  ctx.save();
  ctx.strokeStyle = "#FF4500";

  function drawProjectedLine(p1: Point, p2: Point) {
    const line = transformSimpleLine([p1, p2], perspective);
    ctx.lineWidth = 2;
    drawLine(ctx, line);
    ctx.stroke();
  }

  // X-axis
  drawProjectedLine({ x: 0, y: height * 0.5 }, { x: width, y: height * 0.5 });
  drawProjectedLine({ x: width * 0.5, y: 0 }, { x: width * 0.5, y: height });

  ctx.restore();
}

export function drawPaperSheet(cs: CanvasState) {
  const { ctx, perspective, unitOfMeasure, width, height, displaySettings } =
    cs;
  const fontSize = 32;

  ctx.save();
  ctx.font = `${fontSize}px monospace`;
  ctx.fillStyle = "white";

  const [text, paperWidth, paperHeight] =
    unitOfMeasure == Unit.CM ? ["A4", 29.7, 21] : ["11x8.5", 11, 8.5];

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
  ctx.strokeStyle = strokeColor(displaySettings.theme);
  ctx.stroke();

  const labelWidth = ctx.measureText(text).width;
  ctx.textBaseline = "middle";
  ctx.fillStyle = strokeColor(displaySettings.theme);
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

export function drawBorder(
  cs: CanvasState,
  lineColor: string,
  dashColor: string,
) {
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

export function drawGrid(
  cs: CanvasState,
  outset: number,
  lineDash?: number[],
): void {
  const ctx = cs.ctx;
  ctx.save();
  if (lineDash === undefined) {
    ctx.setLineDash([]);
  } else {
    ctx.setLineDash(lineDash);
  }
  const majorLine = 5;

  /* Vertical lines */
  for (let i = 1; i < cs.width; i++) {
    let lineWidth = cs.minorLineWidth;
    if (i % majorLine === 0 || i === cs.width) {
      lineWidth = cs.majorLineWidth;
    }
    const line = transformSimpleLine(
      [
        { x: i, y: -outset },
        { x: i, y: cs.height + outset },
      ],
      cs.perspective,
    );
    ctx.lineWidth = lineWidth;
    drawLine(ctx, line);
  }

  /* Horizontal lines */
  for (let i = 1; i < cs.height; i++) {
    let lineWidth = cs.minorLineWidth;
    if (i % majorLine === 0 || i === cs.height) {
      lineWidth = cs.majorLineWidth;
    }
    const y = cs.height - i;
    const line = transformSimpleLine(
      [
        { x: -outset, y: y },
        { x: cs.width + outset, y: y },
      ],
      cs.perspective,
    );
    ctx.lineWidth = lineWidth;
    drawLine(ctx, line);
  }
  if (cs.isCalibrating) {
    ctx.fillStyle = strokeColor(cs.displaySettings.theme);
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
  unitOfMeasure: Unit,
) {
  const fontSize = 48;
  const inset = 36;
  ctx.font = `${fontSize}px monospace`;
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
  const heightLabelHeight = ctx.measureText(heightText).actualBoundingBoxAscent;
  ctx.fillText(widthText, line[0].x - widthLabelWidth * 0.5, line[0].y - inset);
  ctx.fillText(
    heightText,
    line[1].x + inset,
    line[1].y + heightLabelHeight * 0.5,
  );
}

function drawFlippedPattern(cs: CanvasState) {
  const { ctx } = cs;
  ctx.save();
  ctx.fillStyle = "#FF4500";
  // draw a grid of dots
  const dotSize = 2;
  const spacing = 72;
  for (let y = 0; y < ctx.canvas.height; y += spacing) {
    for (let x = 0; x < ctx.canvas.width; x += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  ctx.restore();
}
