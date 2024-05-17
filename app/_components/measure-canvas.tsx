import {
  angleDeg,
  constrainInSpace,
  sqrDist,
  sqrDistToLine,
  transformLine,
  transformPoint,
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
import { drawLine, drawArrow, drawCircle } from "@/_lib/drawing";
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
import FlipVerticalIcon from "@/_icons/flip-vertical-icon";
import { useKeyDown } from "@/_hooks/use-key-down";
import { KeyCode } from "@/_lib/key-code";
import KeyboardArrowRightIcon from "@/_icons/keyboard-arrow-right";

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
  const [selectedEnd, setSelectedEnd] = useState<number>(0);
  const dragOffset = useRef<Point | null>(null);
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
        if (selectedLine == i) {
          if (sqrDist(p, line[0]) < 1000) {
            dragOffset.current = { x: p.x - line[0].x, y: p.y - line[0].y };
            setSelectedEnd(0);
            return;
          }
          if (sqrDist(p, line[1]) < 1000) {
            dragOffset.current = { x: p.x - line[1].x, y: p.y - line[1].y };
            setSelectedEnd(1);
            return;
          }
        }
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
    const p = { x: e.clientX, y: e.clientY };

    if (startPoint && measuring) {
      setMovingPoint(p);
    }

    if (e.buttons === 0 && selectedEnd >= 0) {
      // If the mouse button is released, end the drag.
      setSelectedEnd(-1);
      return;
    }

    if (selectedLine >= 0 && selectedEnd >= 0 && dragOffset.current) {
      const line = lines[selectedLine];
      const m = inverse(transform).mmul(perspective);
      const op = {
        x: p.x - dragOffset.current.x,
        y: p.y - dragOffset.current.y,
      };
      const pt = transformPoint(op, m);
      if (selectedEnd == 0) {
        const newLine: Line = [pt, line[1]];
        setLines(lines.toSpliced(selectedLine, 1, newLine));
      } else {
        const newLine: Line = [line[0], pt];
        setLines(lines.toSpliced(selectedLine, 1, newLine));
      }
    }
  };

  const handlePointerUp = () => {
    setSelectedEnd(-1);
  };

  function handleDeleteLine() {
    if (selectedLine >= 0) {
      setLines(lines.toSpliced(selectedLine, 1));
      if (selectedLine == 0) {
        setSelectedLine(lines.length - 2);
      } else {
        setSelectedLine(selectedLine - 1);
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        ctx.strokeStyle = "#9333ea";

        ctx.lineWidth = 4;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const m = calibrationTransform.mmul(transform);
        for (let i = 0; i < lines.length; i++) {
          if (i !== selectedLine) {
            drawLine(ctx, transformLine(lines[i], m));
          }
        }
        if (lines.length > 0 && selectedLine >= 0) {
          const line = lines.at(selectedLine);
          if (line) {
            const l = transformLine(line, transform);
            const axis = transformLine(
              [l[0], { x: l[0].x + 96 + 48, y: l[0].y }],
              calibrationTransform,
            );
            ctx.save();
            ctx.lineWidth = 1;
            drawLine(ctx, axis);
            ctx.restore();
            const tl = transformLine(line, m);
            drawArrow(ctx, tl);
            drawCircle(ctx, tl[0], 30);
            drawCircle(ctx, tl[1], 30);
            drawMeasurementsAt(ctx, l, tl[1]);
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
          const screenLine: Line = [startPoint, dest];
          const line = transformLine(screenLine, perspective);
          drawMeasurementsAt(ctx, line, startPoint);
          drawLine(ctx, screenLine);
          const axis = transformLine(
            [line[0], { x: line[0].x + 96 + 48, y: line[0].y }],
            calibrationTransform,
          );
          ctx.save();
          ctx.lineWidth = 1;
          drawLine(ctx, axis);
          ctx.restore();
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
      ctx.fillStyle = "#000";
      const o = 10;
      const text = measurements(line, unitOfMeasure);
      ctx.lineWidth = 4;
      ctx.strokeText(text, p1.x + o, p1.y + o);
      ctx.fillText(text, p1.x + o, p1.y + o);
      ctx.restore();
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

  useKeyDown(() => {
    handleDeleteLine();
  }, [KeyCode.Backspace]);

  const m = calibrationTransform.mmul(transform);
  const selected = lines.at(selectedLine);
  const opLine = selected ? transformLine(selected, transform) : null;
  const point = selected ? transformLine(selected, m)[0] : null;
  const borderIconButton = "border-2 border-black dark:border-white";
  return (
    <div className={className}>
      <div
        onKeyDown={(e) => setAxisConstrained(e.shiftKey)}
        onKeyUp={(e) => setAxisConstrained(e.shiftKey)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        tabIndex={0}
        className={`${measuring ? "cursor-crosshair" : ""} h-screen w-screen`}
      >
        <div
          className={`${measuring || selectedEnd >= 0 ? "pointer-events-none" : ""}`}
        >
          {children}
        </div>
        <canvas
          ref={canvasRef}
          className={`absolute top-0 inset-0 w-full h-full pointer-events-none`}
        ></canvas>
      </div>
      <menu
        className={`absolute flex gap-2 p-2 ${visible(selectedLine >= 0)}`}
        style={{
          top: `${point?.y ?? 0}px`,
          left: `${point?.x ?? 0}px`,
        }}
      >
        <Tooltip description={t("rotateToHorizontal")}>
          <IconButton
            className={borderIconButton}
            onClick={() => {
              if (opLine) {
                transformer.rotateToHorizontal(opLine);
              }
            }}
          >
            <RotateToHorizontalIcon ariaLabel={t("rotateToHorizontal")} />
          </IconButton>
        </Tooltip>
        <Tooltip description={t("flipAlong")}>
          <IconButton
            className={borderIconButton}
            onClick={() => {
              if (opLine) {
                transformer.flipAlong(opLine);
              }
            }}
          >
            <FlipVerticalIcon ariaLabel={t("flipAlong")} />
          </IconButton>
        </Tooltip>
        <Tooltip description={t("translate")}>
          <IconButton
            className={borderIconButton}
            onClick={() => {
              if (opLine) {
                const p = {
                  x: opLine[1].x - opLine[0].x,
                  y: opLine[1].y - opLine[0].y,
                };
                transformer.translate(p);
                if (selected) {
                  const newLines = lines.slice();
                  newLines[selectedLine] = [selected[1], selected[0]];
                  setLines(newLines);
                }
              }
            }}
          >
            <KeyboardArrowRightIcon ariaLabel={t("translate")} />
          </IconButton>
        </Tooltip>
        <Tooltip description={t("deleteLine")}>
          <IconButton className={borderIconButton} onClick={handleDeleteLine}>
            <CloseIcon ariaLabel={t("deleteLine")} />
          </IconButton>
        </Tooltip>
      </menu>
    </div>
  );
}

function measurements(line: Line, unitOfMeasure: string): string {
  let a = -angleDeg(line);
  if (a < 0) {
    a += 360;
  }
  let label = a.toFixed(0);
  if (label == "360") {
    label = "0";
  }
  const d = distance(line[0], line[1], unitOfMeasure);
  return `${d} ${label}°`;
}

function distance(p1: Point, p2: Point, unitOfMeasure: string): string {
  let d = Math.sqrt(sqrDist(p1, p2)) / CSS_PIXELS_PER_INCH;
  if (unitOfMeasure == CM) {
    d *= 2.54;
  }
  const unit = unitOfMeasure == CM ? "cm" : '"';
  return `${d.toFixed(2)}${unit}`;
}
