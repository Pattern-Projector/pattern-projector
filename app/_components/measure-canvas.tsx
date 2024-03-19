import { sqrdist, transformPoints } from "@/_lib/geometry";
import { CSS_PIXELS_PER_INCH } from "@/_lib/pixels-per-inch";
import { Point } from "@/_lib/point";
import Matrix from "ml-matrix";
import React, { useEffect, useRef, useState } from "react";
import { CM } from "@/_lib/unit";

export default function MeasureCanvas({
  perspective,
  unitOfMeasure,
}: {
  perspective: Matrix;
  unitOfMeasure: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = { x: e.clientX, y: e.clientY };

    if (!startPoint) {
      setStartPoint(p);
    } else if (!endPoint) {
      setEndPoint(p);
    } else {
      setStartPoint(p);
      setEndPoint(null);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#9333ea";
        ctx.fillStyle = "#9333ea";
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (startPoint) {
          ctx.beginPath();
          ctx.arc(startPoint.x, startPoint.y, 5, 0, 2 * Math.PI);
          ctx.fill();
        }

        if (endPoint) {
          ctx.beginPath();
          ctx.arc(endPoint.x, endPoint.y, 5, 0, 2 * Math.PI);
          ctx.fill();
        }

        if (startPoint && endPoint) {
          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(endPoint.x, endPoint.y);
          ctx.stroke();

          const line = transformPoints([startPoint, endPoint], perspective);
          let distance =
            Math.sqrt(sqrdist(line[0], line[1])) / CSS_PIXELS_PER_INCH;
          if (unitOfMeasure == CM) {
            distance *= 2.54;
          }
          ctx.font = "24px sans-serif";
          const o = 10;
          ctx.fillText(
            `${distance.toFixed(2)} ${unitOfMeasure.toLocaleLowerCase()}`,
            startPoint.x + o,
            startPoint.y + o,
          );
        }
      }
    }
  }, [startPoint, endPoint, perspective, unitOfMeasure]);

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      onPointerDown={handlePointerDown}
    />
  );
}
