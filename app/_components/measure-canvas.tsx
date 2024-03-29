import { constrainInSpace, sqrdist, transformPoints } from "@/_lib/geometry";
import { CSS_PIXELS_PER_INCH } from "@/_lib/pixels-per-inch";
import { Point } from "@/_lib/point";
import Matrix from "ml-matrix";
import React, { useEffect, useRef, useState } from "react";
import { CM } from "@/_lib/unit";
import { drawLine } from "@/_lib/drawing";
import { useKeyDown } from "@/_hooks/use-key-down";
import { KeyCode } from "@/_lib/key-code";

export default function MeasureCanvas({
  perspective,
  calibrationTransform,
  unitOfMeasure,
  className,
}: {
  perspective: Matrix;
  calibrationTransform: Matrix;
  unitOfMeasure: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [axisConstrained, setAxisConstrained] = useState<boolean>(false);
  const [movingPoint, setMovingPoint] = useState<Point | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = { x: e.clientX, y: e.clientY };

    if (!startPoint) {
      setStartPoint(p);
    } else if (!endPoint) {
      setEndPoint(
        axisConstrained
          ? constrainInSpace(p, startPoint, perspective, calibrationTransform)
          : p,
      );
    } else {
      setStartPoint(p);
      setEndPoint(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (startPoint) {
      setMovingPoint({ x: e.clientX, y: e.clientY });
    }
  };

  useKeyDown(() => {
    setStartPoint(null);
    setMovingPoint(null);
    setEndPoint(null);
  }, [KeyCode.Escape]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        ctx.strokeStyle = "#9333ea";
        ctx.fillStyle = "#1E40AF";
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (startPoint && movingPoint) {
          let dest = axisConstrained
            ? constrainInSpace(
                movingPoint,
                startPoint,
                perspective,
                calibrationTransform,
              )
            : movingPoint;
          if (endPoint) {
            dest = endPoint;
          }
          drawLine(ctx, startPoint, dest, 4);
          drawDistance(ctx, startPoint, dest);
        }
      }
    }

    function drawDistance(ctx: CanvasRenderingContext2D, p1: Point, p2: Point) {
      ctx.font = "24px sans-serif";
      ctx.strokeStyle = "#fff";
      const o = 10;
      const d = distance(p1, p2);
      ctx.lineWidth = 4;
      ctx.strokeText(d, p1.x + o, p1.y + o);
      ctx.fillText(d, p1.x + o, p1.y + o);
    }

    function distance(p1: Point, p2: Point) {
      const line = transformPoints([p1, p2], perspective);
      let d = Math.sqrt(sqrdist(line[0], line[1]))
      return `${d.toFixed(2)} ${unitOfMeasure.toLocaleLowerCase()}`;
    }
  }, [
    startPoint,
    movingPoint,
    endPoint,
    perspective,
    unitOfMeasure,
    axisConstrained,
    calibrationTransform,
  ]);

  return (
    <canvas
      ref={canvasRef}
      onKeyDown={(e) => setAxisConstrained(e.shiftKey)}
      onKeyUp={(e) => setAxisConstrained(e.shiftKey)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      className={`${className} cursor-crosshair absolute inset-0 w-full h-full z-20`}
      tabIndex={-1}
    />
  );
}
