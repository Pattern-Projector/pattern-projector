import { CM } from "@/_lib/unit";
import Matrix from "ml-matrix";
import { Point } from "@/_lib/point";
import { DisplaySettings, fillColor, strokeColor } from "@/_lib/display-settings";
import {
  checkIsConcave, rectCorners, transformPoint, transformPoints, translatePoints
} from "@/_lib/geometry";
import { CornerColorHex } from "@/_components/theme/colors";

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
    public unitOfMeasure: string,
    public errorFillPattern: CanvasFillStrokeStyles["fillStyle"],
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
): void {
  ctx.beginPath();
  for (let p of points) {
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
}

export function drawOverlays(cs: CanvasState) {
  const { ctx, displaySettings } = cs;
  const { grid, border, paper, flipLines } = displaySettings.overlay;
  const { theme } = displaySettings;
  if (grid) {
    ctx.strokeStyle = strokeColor(theme);
    drawGrid(cs, 8, [1]);
  }
  if (border) {
    drawBorder(cs, strokeColor(theme), fillColor(theme));
  }
  if (paper) {
    drawPaperSheet(cs);
  }
  if (flipLines) {
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

export function drawCalibrationPoints(cs: CanvasState) {
  const { ctx, points } = cs;
  points.forEach((point, index) => {
    ctx.beginPath();
    ctx.strokeStyle = [
      CornerColorHex.TOPLEFT,
      CornerColorHex.TOPRIGHT,
      CornerColorHex.BOTTOMRIGHT,
      CornerColorHex.BOTTOMLEFT,
    ][index];
    const radius = cs.corners.has(index) ? 20 : 10;
    ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 4;
    ctx.stroke();
  });
}

export function drawPaperSheet(cs: CanvasState) {
  const { ctx, perspective, unitOfMeasure, width, height, displaySettings } = cs;
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
  unitOfMeasure: string,
) {
  const fontSize = 48;
  const inset = 20;
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
