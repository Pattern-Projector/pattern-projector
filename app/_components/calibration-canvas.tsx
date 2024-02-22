import Matrix from "ml-matrix";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

import { interp, minIndex, sqrdist, transformPoints } from "@/_lib/geometry";
import {
  applyOffset,
  mouseToCanvasPoint,
  Point,
  touchToCanvasPoint,
} from "@/_lib/point";

const maxPoints = 4; // One point per vertex in rectangle

function draw(
  ctx: CanvasRenderingContext2D,
  offset: Point,
  points: Point[],
  width: number,
  height: number,
  perspective: Matrix,
  isCalibrating: boolean,
  pointToModify: number | null,
  ptDensity: number
): void {
  ctx.translate(offset.x, offset.y);

  ctx.fillStyle = "#000";

  drawPolygon(ctx, points);
  if (isCalibrating) {
    ctx.fill();
  } else {
    // Draw border
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
    drawGrid(ctx, width, height, perspective, 2, ptDensity);
    const v = 1;
    ctx.strokeStyle = "#000";
    ctx.setLineDash([v * 3, v]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    drawGrid(ctx, width, height, perspective, 0, ptDensity);
    ctx.stroke();

    if (pointToModify !== null) {
      ctx.beginPath();
      ctx.arc(
        points[pointToModify].x,
        points[pointToModify].y,
        20,
        0,
        2 * Math.PI
      );
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  } else {
    drawGrid(ctx, width, height, perspective, 8, ptDensity);
    const v = 1;
    ctx.setLineDash([1]);
    ctx.strokeStyle = "#000000";
    //ctx.setLineDash([v * 3, v]);
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.beginPath();
    drawGrid(ctx, width, height, perspective, 0, ptDensity);
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
  outset: number,
  ptDensity: number
): void {
  for (let i = 1; i < width; i++) {
    // TODO: fix needing dpi added in here.
    const line = transformPoints(
      [
        { x: i * ptDensity, y: -outset * ptDensity },
        { x: i * ptDensity, y: (height + outset) * ptDensity },
      ],
      perspective
    );
    drawLine(ctx, line[0], line[1]);
  }
  for (let i = 1; i < height; i++) {
    const line = transformPoints(
      [
        { x: -outset * ptDensity, y: i * ptDensity },
        { x: (width + outset) * ptDensity, y: i * ptDensity },
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

const CORNER_MARGIN = 150;

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
  ptDensity,
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
  ptDensity: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });

  useEffect(() => {
    if (canvasRef !== null && canvasRef.current !== null) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx !== null) {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        draw(
          ctx,
          applyOffset(canvasOffset, dragOffset),
          points,
          width,
          height,
          perspective,
          isCalibrating,
          pointToModify,
          ptDensity
        );
      }
    }
  }, [
    canvasOffset,
    dragOffset,
    points,
    perspective,
    width,
    height,
    isCalibrating,
    pointToModify,
    ptDensity,
  ]);

  function handleDown(newPoint: Point) {
    if (points.length < maxPoints) {
      setPoints([...points, newPoint]);
    } else {
      const shortestDist: number = points
        .map((a) => Math.sqrt(sqrdist(a, newPoint)))
        .reduce((final, a) => (!final || a < final ? a : final));
      if (shortestDist < CORNER_MARGIN) {
        setPointToModify(minIndex(points.map((a) => sqrdist(a, newPoint))));
      } else {
        setPointToModify(null);
        setPanStart(newPoint);
      }
    }
  }

  function handleMove(p: Point, filter: number) {
    if (pointToModify !== null) {
      const newPoints = [...points];
      newPoints[pointToModify] = interp(newPoints[pointToModify], p, filter);
      setPoints(newPoints);
    } else if (panStart !== null) {
      setDragOffset({ x: p.x - panStart.x, y: p.y - panStart.y });
    }
  }

  function handleMouseUp() {
    localStorage.setItem("points", JSON.stringify(points));
    if (panStart) {
      setPoints(points.map((p) => applyOffset(p, dragOffset)));
      setDragOffset({ x: 0, y: 0 });
      setPanStart(null);
    }
  }

  function handleTouchUp() {
    localStorage.setItem("points", JSON.stringify(points));
    setPointToModify(null);
    setPanStart(null);
  }

  function modifyPoint(xOffset: number, yOffset: number): void {
    if (pointToModify !== null) {
      const newPoints = [...points];
      newPoints[pointToModify] = {
        x: newPoints[pointToModify].x + xOffset,
        y: newPoints[pointToModify].y + yOffset,
      };
      setPoints(newPoints);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (pointToModify !== null) {
      switch (e.code) {
        case "ArrowLeft":
          modifyPoint(-1, 0);
          break;
        case "ArrowUp":
          modifyPoint(0, -1);
          break;
        case "ArrowRight":
          modifyPoint(1, 0);
          break;
        case "ArrowDown":
          modifyPoint(0, 1);
          break;
      }
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className={className + " outline-none"}
      onKeyDown={(e) => handleKeyDown(e)}
      onMouseMove={(e: React.MouseEvent) => {
        if ((e.buttons & 1) == 0) {
          handleMouseUp();
        } else {
          handleMove(mouseToCanvasPoint(e), 1);
        }
      }}
      onMouseDown={(e) => handleDown(mouseToCanvasPoint(e))}
      onMouseUp={() => handleMouseUp()}
      onTouchStart={(e: React.TouchEvent) => handleDown(touchToCanvasPoint(e))}
      onTouchMove={(e: React.TouchEvent) =>
        handleMove(touchToCanvasPoint(e), 0.05)
      }
      onTouchEnd={() => handleTouchUp()}
      style={{
        cursor:
          pointToModify !== null
            ? "url('/crosshair.png') 11 11, crosshair"
            : "grab",
        pointerEvents: isCalibrating ? "auto" : "none",
      }}
      tabIndex={-1}
    />
  );
}
