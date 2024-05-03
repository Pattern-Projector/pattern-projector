import {
  angleDeg,
  constrainInSpace,
  sqrDist,
  transformLine,
} from "@/_lib/geometry";
import { CSS_PIXELS_PER_INCH } from "@/_lib/pixels-per-inch";
import { Point } from "@/_lib/point";
import Matrix, { inverse } from "ml-matrix";
import React, { useEffect, useRef, useState } from "react";
import { CM } from "@/_lib/unit";
import { drawLine } from "@/_lib/drawing";
import { useTranslations } from "next-intl";
import {
  useTransformContext,
  useTransformerContext,
} from "@/_hooks/use-transform-context";
import { Line } from "@/_lib/interfaces/line";
import { IconButton } from "./buttons/icon-button";
import RotateToHorizontalIcon from "@/_icons/rotate-to-horizontal";
import CloseIcon from "@/_icons/close-icon";
import { visible } from "./theme/css-functions";

export default function MeasureCanvas({
  perspective,
  calibrationTransform,
  unitOfMeasure,
  className,
  measuring,
}: {
  perspective: Matrix;
  calibrationTransform: Matrix;
  unitOfMeasure: string;
  className?: string;
  measuring: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [axisConstrained, setAxisConstrained] = useState<boolean>(false);
  const [movingPoint, setMovingPoint] = useState<Point | null>(null);
  const transformer = useTransformerContext();
  const t = useTranslations("MeasureCanvas");
  const transform = useTransformContext();

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = { x: e.clientX, y: e.clientY };

    if (!startPoint) {
      setStartPoint(p);
      setMovingPoint(p);
    } else {
      const end = axisConstrained
        ? constrainInSpace(p, startPoint, perspective, calibrationTransform)
        : p;
      const m = inverse(transform).mmul(perspective);
      const pdfLine = transformLine([startPoint, end], m);
      setLines([...lines, pdfLine]);
      setStartPoint(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (startPoint) {
      setMovingPoint({ x: e.clientX, y: e.clientY });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        ctx.strokeStyle = "#9333ea";
        ctx.fillStyle = "#1E40AF";
        ctx.lineWidth = 4;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const m = calibrationTransform.mmul(transform);
        for (const line of lines) {
          const calibrationLine = transformLine(line, m);
          drawLine(ctx, calibrationLine);
        }
        if (lines.length > 0) {
          const lastLine = lines.at(-1);
          if (lastLine) {
            drawMeasurementsAt(ctx, lastLine, transformLine(lastLine, m)[0]);
          }
        }

        if (startPoint && movingPoint) {
          const dest = axisConstrained
            ? constrainInSpace(
                movingPoint,
                startPoint,
                perspective,
                calibrationTransform,
              )
            : movingPoint;
          const line = transformLine([startPoint, dest], perspective);
          drawMeasurementsAt(ctx, line, startPoint);
          drawLine(ctx, [startPoint, dest]);
        }
      }
    }

    function drawMeasurementsAt(
      ctx: CanvasRenderingContext2D,
      line: Line,
      p1: Point,
    ) {
      ctx.save();
      ctx.font = "24px sans-serif";
      ctx.strokeStyle = "#fff";
      const o = 10;
      const d = distance(line[0], line[1]);
      const angle = `${-angleDeg(line[0], line[1]).toFixed(2)}°`;
      const text = `${d}, ${angle}`;
      ctx.lineWidth = 4;
      ctx.strokeText(text, p1.x + o, p1.y + o);
      ctx.fillText(text, p1.x + o, p1.y + o);
      ctx.restore();
    }

    function distance(p1: Point, p2: Point) {
      let d = Math.sqrt(sqrDist(p1, p2)) / CSS_PIXELS_PER_INCH;
      if (unitOfMeasure == CM) {
        d *= 2.54;
      }
      return `${d.toFixed(2)} ${unitOfMeasure.toLocaleLowerCase()}`;
    }
  }, [
    startPoint,
    movingPoint,
    perspective,
    unitOfMeasure,
    axisConstrained,
    calibrationTransform,
    lines,
    transform,
  ]);

  const m = calibrationTransform.mmul(transform);
  const lastLine = lines.at(-1);
  const rotateLine = lastLine ? transformLine(lastLine, transform) : null;
  const endPoint = lastLine ? transformLine(lastLine, m)[1] : null;
  return (
    <>
      <menu className={visible(measuring)}>
        <IconButton
          className={`absolute z-[100] m-0 border-2 border-black dark:border-white`}
          style={{
            top: endPoint ? `${endPoint.y + 10}px` : "-40px",
            left: endPoint ? `${endPoint.x + 10}px` : "-40px",
          }}
          onClick={() => {
            if (rotateLine) {
              transformer.rotateToHorizontal(rotateLine);
            }
          }}
        >
          <RotateToHorizontalIcon ariaLabel={t("rotateToHorizontal")} />
        </IconButton>
        <IconButton
          className={`absolute z-[100] m-0 border-2 border-black dark:border-white`}
          style={{
            top: endPoint ? `${endPoint.y + 10}px` : "-40px",
            left: endPoint ? `${endPoint.x + 64}px` : "-40px",
          }}
          onClick={() => {
            if (lastLine) {
              setLines(lines.slice(0, -1));
            }
          }}
        >
          <CloseIcon ariaLabel={t("deleteLine")} />
        </IconButton>
      </menu>
      <canvas
        ref={canvasRef}
        onKeyDown={(e) => setAxisConstrained(e.shiftKey)}
        onKeyUp={(e) => setAxisConstrained(e.shiftKey)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className={`${className} cursor-crosshair absolute inset-0 w-full h-full z-20 ${!measuring && "pointer-events-none"}`}
        tabIndex={-1}
      />
    </>
  );
}
