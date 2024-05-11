import {
  angleDeg,
  constrainInSpace,
  sqrDist,
  sqrDistToLine,
  transformLine,
} from "@/_lib/geometry";
import { CSS_PIXELS_PER_INCH } from "@/_lib/pixels-per-inch";
import { Point } from "@/_lib/point";
import Matrix, { inverse } from "ml-matrix";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
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
import Tooltip from "./tooltip/tooltip";

export default function MeasureCanvas({
  perspective,
  calibrationTransform,
  unitOfMeasure,
  className,
  measuring,
  setMeasuring,
  file,
  children,
}: {
  perspective: Matrix;
  calibrationTransform: Matrix;
  unitOfMeasure: string;
  className?: string;
  measuring: boolean;
  setMeasuring: Dispatch<SetStateAction<boolean>>;
  file: File | null;
  children: React.ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [selectedLine, setSelectedLine] = useState<number>(-1);
  const [lines, setLines] = useState<Line[]>([]);
  const [axisConstrained, setAxisConstrained] = useState<boolean>(false);
  const [movingPoint, setMovingPoint] = useState<Point | null>(null);
  const transformer = useTransformerContext();
  const t = useTranslations("MeasureCanvas");
  const transform = useTransformContext();

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = { x: e.clientX, y: e.clientY };

    if (!startPoint && lines.length > 0) {
      const m = calibrationTransform.mmul(transform);
      for (let i = 0; i < lines.length; i++) {
        const line = transformLine(lines[i], m);
        if (sqrDistToLine(line, p) < 100) {
          if (i == selectedLine) {
            setSelectedLine(-1);
            return;
          } else {
            setSelectedLine(i);
            return;
          }
        }
      }
      setSelectedLine(-1);
    }

    if (!measuring) {
      return;
    }

    if (!startPoint) {
      setStartPoint(p);
      setMovingPoint(p);
    } else {
      const end = axisConstrained
        ? constrainInSpace(p, startPoint, perspective, calibrationTransform)
        : p;
      const m = inverse(transform).mmul(perspective);
      const pdfLine = transformLine([startPoint, end], m);
      setSelectedLine(lines.length);
      setLines([...lines, pdfLine]);
      setStartPoint(null);
      setMeasuring(false);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startPoint && measuring) {
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
        if (lines.length > 0 && selectedLine >= 0) {
          const line = lines.at(selectedLine);
          if (line) {
            drawMeasurementsAt(ctx, line, transformLine(line, m)[0]);
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
    selectedLine,
    measuring,
  ]);

  useEffect(() => {
    setLines([]);
    setSelectedLine(-1);
  }, [file]);

  const m = calibrationTransform.mmul(transform);
  const selected = lines.at(selectedLine);
  const rotateLine = selected ? transformLine(selected, transform) : null;
  const endPoint = selected ? transformLine(selected, m)[1] : null;
  return (
    <div>
      <menu
        className={`absolute flex gap-2 ${visible(selectedLine >= 0)}`}
        style={{
          top: `${endPoint?.y ?? 0 + 4}px`,
          left: `${endPoint?.x ?? 0 + 4}px`,
        }}
      >
        <Tooltip description={t("rotateToHorizontal")}>
          <IconButton
            className={`relative z-[100] m-0 border-2 border-black dark:border-white`}
            onClick={() => {
              if (rotateLine) {
                transformer.rotateToHorizontal(rotateLine);
              }
            }}
          >
            <RotateToHorizontalIcon ariaLabel={t("rotateToHorizontal")} />
          </IconButton>
        </Tooltip>
        <Tooltip description={t("deleteLine")}>
          <IconButton
            className={`relative z-[100] m-0 border-2 border-black dark:border-white`}
            onClick={() => {
              if (selectedLine >= 0) {
                setLines(lines.toSpliced(selectedLine, 1));
                if (selectedLine == 0) {
                  setSelectedLine(lines.length - 2);
                } else {
                  setSelectedLine(selectedLine - 1);
                }
              }
            }}
          >
            <CloseIcon ariaLabel={t("deleteLine")} />
          </IconButton>
        </Tooltip>
      </menu>
      <div
        onKeyDown={(e) => setAxisConstrained(e.shiftKey)}
        onKeyUp={(e) => setAxisConstrained(e.shiftKey)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className={`${measuring ? "cursor-crosshair" : ""}`}
      >
        <canvas
          ref={canvasRef}
          className={`${className} absolute inset-0 w-full h-full pointer-events-none z-10`}
          tabIndex={-1}
        ></canvas>
        <div className={`${measuring ? "pointer-events-none" : ""}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
