import Matrix from "ml-matrix";
import React, { Dispatch, SetStateAction, useEffect, useRef } from "react";

import { interp, minIndex, sqrdist, transformPoints } from "@/_lib/geometry";
import { mouseToCanvasPoint, Point, touchToCanvasPoint } from "@/_lib/point";

const maxPoints = 4; // One point per vertex in rectangle

function draw(
  ctx: CanvasRenderingContext2D,
  offset: Point,
  points: Point[],
  width: number,
  height: number,
  perspective: Matrix,
  isCalibrating: boolean
): void {
  ctx.translate(offset.x, offset.y);

  ctx.fillStyle = "#000";

  drawPolygon(ctx, points);
  if (isCalibrating) {
    ctx.fill();
  } else {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.lineDashOffset = 0;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#fff";
    ctx.stroke();
  }

  ctx.strokeStyle = "#fff";
  ctx.beginPath();
  if (isCalibrating) {
    drawGrid(ctx, width, height, perspective, 2);
    const v = 1;
    ctx.strokeStyle = "#000";
    ctx.setLineDash([v * 3, v]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    drawGrid(ctx, width, height, perspective, 0);
    ctx.stroke();
  } else {
    drawGrid(ctx, width, height, perspective, 8);
    const v = 1;
    ctx.setLineDash([1]);
    ctx.strokeStyle = "#000000";
    //ctx.setLineDash([v * 3, v]);
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.beginPath();
    drawGrid(ctx, width, height, perspective, 0);
    const t = 1;
    ctx.strokeStyle = "#aaaaaa88";
    ctx.setLineDash([t * 3, t]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  perspective: Matrix,
  outset: number
): void {
  for (let i = 1; i < width; i++) {
    // TODO: fix needing dpi added in here.
    const line = transformPoints(
      [
        { x: i * 96, y: -outset * 96 },
        { x: i * 96, y: (height + outset) * 96 },
      ],
      perspective
    );
    drawLine(ctx, line[0], line[1]);
  }
  for (let i = 1; i < height; i++) {
    const line = transformPoints(
      [
        { x: -outset * 96, y: i * 96 },
        { x: (width + outset) * 96, y: i * 96 },
      ],
      perspective
    );
    drawLine(ctx, line[0], line[1]);
  }
}

function drawLine(ctx: CanvasRenderingContext2D, p1: Point, p2: Point): void {
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
}

function drawPolygon(ctx: CanvasRenderingContext2D, points: Point[]): void {
  const last = points.at(-1);
  if (last === undefined) {
    return;
  }
  ctx.moveTo(last.x, last.y);
  for (let p of points) {
    ctx.lineTo(p.x, p.y);
  }
}

/**
 * A window width and height canvas used for projector calibration
 * @param draw - Draws in the canvas rendering context
 */
export default function CalibrationCanvas({
  className,
  canvasOffset,
  points,
  setPoints,
  pointToModify,
  setPointToModify,
  perspective,
  width,
  height,
  isCalibrating,
}: {
  className: string | undefined;
  canvasOffset: Point;
  points: Point[];
  setPoints: Dispatch<SetStateAction<Point[]>>;
  pointToModify: number | null;
  setPointToModify: Dispatch<SetStateAction<number | null>>;
  perspective: Matrix;
  width: number;
  height: number;
  isCalibrating: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (canvasRef !== null && canvasRef.current !== null) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx !== null) {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        draw(
          ctx,
          canvasOffset,
          points,
          width,
          height,
          perspective,
          isCalibrating
        );
      }
    }
  }, [canvasOffset, points, perspective, width, height, isCalibrating]);

  function handleDown(newPoint: Point) {
    if (points.length < maxPoints) {
      setPoints([...points, newPoint]);
    } else {
      setPointToModify(minIndex(points.map((a) => sqrdist(a, newPoint))));
    }
  }

  function handleMove(p: Point, filter: number) {
    if (pointToModify !== null) {
      const newPoints = [...points];
      newPoints[pointToModify] = interp(newPoints[pointToModify], p, filter);
      setPoints(newPoints);
    }
  }

  function handleUp() {
    localStorage.setItem("points", JSON.stringify(points));
    setPointToModify(null);
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      onMouseMove={(e: React.MouseEvent) => {
        if ((e.buttons & 1) == 0) {
          handleUp();
        } else {
          handleMove(mouseToCanvasPoint(e), 1);
        }
      }}
      onMouseDown={(e) => handleDown(mouseToCanvasPoint(e))}
      onMouseUp={() => handleUp()}
      onTouchStart={(e: React.TouchEvent) => handleDown(touchToCanvasPoint(e))}
      onTouchMove={(e: React.TouchEvent) =>
        handleMove(touchToCanvasPoint(e), 0.05)
      }
      onTouchEnd={() => handleUp()}
      style={{
        cursor: "url('/crosshair.png') 11 11, crosshair",
        pointerEvents: isCalibrating ? "auto" : "none",
      }}
    />
  );
}
