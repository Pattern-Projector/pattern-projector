import { Matrix } from "ml-matrix";
import { ReactNode, useState, useRef, useEffect } from "react";

import { toMatrix3d, transformPoint, translate } from "@/_lib/geometry";
import { Point } from "@/_lib/point";
import { CSS_PIXELS_PER_INCH } from "@/_lib/pixels-per-inch";
import { IN } from "@/_lib/unit";
import useProgArrowKeyToMatrix from "@/_hooks/use-prog-arrow-key-to-matrix";
import { visible } from "./theme/css-functions";
import {
  useTransformContext,
  useTransformerContext,
} from "@/_hooks/use-transform-context";

export default function Draggable({
  children,
  perspective,
  isCalibrating,
  unitOfMeasure,
  calibrationTransform,
  className,
}: {
  children: ReactNode;
  perspective: Matrix;
  isCalibrating: boolean;
  unitOfMeasure: string;
  calibrationTransform: Matrix;
  className: string;
}) {
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [transformStart, setTransformStart] = useState<Matrix | null>(null);
  const [isIdle, setIsIdle] = useState(false);
  const [matrix3d, setMatrix3d] = useState<string>("");

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const transform = useTransformContext();
  const transformer = useTransformerContext();

  const quarterInchPx = CSS_PIXELS_PER_INCH / 4;
  const halfCmPx = CSS_PIXELS_PER_INCH / 2.54 / 2;
  const scale = unitOfMeasure === IN ? quarterInchPx : halfCmPx;

  useProgArrowKeyToMatrix(!isCalibrating, scale, (matrix) => {
    transformer.setLocalTransform(matrix.mmul(transform));
  });

  useEffect(() => {
    setMatrix3d(toMatrix3d(calibrationTransform.mmul(transform)));
  }, [transform, calibrationTransform]);

  const IDLE_TIMEOUT = 1500;

  function resetIdle() {
    setIsIdle(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
    }, IDLE_TIMEOUT);
  }

  function handleOnEnd(): void {
    setDragStart(null);
    setTransformStart(null);
  }

  function handleMove(e: React.PointerEvent) {
    const p = { x: e.clientX, y: e.clientY };

    if (e.pointerType === "mouse") {
      resetIdle();
      /* If we aren't currently dragging, ignore the mouse move event */
      if (dragStart === null) {
        return;
      }
    }

    if (transformStart !== null && dragStart !== null) {
      const dest = transformPoint(p, perspective);
      const tx = dest.x - dragStart.x;
      const ty = dest.y - dragStart.y;
      const vec = { x: tx, y: ty };
      transformer.setLocalTransform(translate(vec).mmul(transformStart));
    }
  }

  function handleOnStart(e: React.PointerEvent): void {
    const p = { x: e.clientX, y: e.clientY };
    const pt = transformPoint(p, perspective);
    setDragStart(pt);
    setTransformStart(transform.clone());
  }

  let cursorMode = `${dragStart !== null ? "grabbing" : "grab"}`;
  let viewportCursorMode = `${dragStart !== null ? "grabbing" : "default"}`;

  /* If we aren't dragging and the idle timer has set isIdle
   * to true, hide the cursor */
  if (dragStart === null && isIdle) {
    cursorMode = "none";
    viewportCursorMode = "none";
  }

  return (
    <div
      tabIndex={0}
      className={`${className ?? ""} select-none absolute top-0 ${visible(!isCalibrating)} bg-white dark:bg-black transition-all duration-500 w-screen h-screen`}
      onPointerMove={handleMove}
      onMouseEnter={resetIdle}
      onMouseUp={handleOnEnd}
      style={{
        cursor: viewportCursorMode,
      }}
    >
      <div
        className={`select-none ${visible(!isCalibrating)}`}
        onPointerMove={handleMove}
        onPointerDown={handleOnStart}
        onPointerUp={handleOnEnd}
        style={{
          cursor: cursorMode,
        }}
      >
        <div
          className={"absolute"}
          style={{
            transform: `${matrix3d}`,
            transformOrigin: "0 0",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
