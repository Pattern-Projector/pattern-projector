import { Matrix } from "ml-matrix";
import {
  ReactNode,
  MouseEvent,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";

import {
  toMatrix3d,
  toSingleAxisVector,
  transformPoint,
  translate,
} from "@/_lib/geometry";
import { mouseToCanvasPoint, Point, touchToCanvasPoint } from "@/_lib/point";
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
}: {
  children: ReactNode;
  perspective: Matrix;
  isCalibrating: boolean;
  unitOfMeasure: string;
  calibrationTransform: Matrix;
}) {
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<Point | null>(null);
  const [transformStart, setTransformStart] = useState<Matrix | null>(null);
  const [isAxisLocked, setIsAxisLocked] = useState<Boolean>(false);
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [matrix3d, setMatrix3d] = useState<string>("");
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

  const AXIS_LOCK_KEYBIND = "Shift";
  const IDLE_TIMEOUT = 1500;

  const handleKeyDown = useCallback(
    function (e: React.KeyboardEvent) {
      if (e.key === AXIS_LOCK_KEYBIND) {
        e.preventDefault();
        setIsAxisLocked(true);
      }
    },
    [setIsAxisLocked],
  );

  const handleKeyUp = useCallback(
    function (e: React.KeyboardEvent) {
      if (e.key === AXIS_LOCK_KEYBIND) {
        e.preventDefault();
        setIsAxisLocked(false);
      }
    },
    [setIsAxisLocked],
  );

  /* This effect causes the position of the div to update instantly if
   isAxisLocked changes, rather than needing the mouse to move first */
  useEffect(() => {
    if (dragStart !== null && isAxisLocked && currentMousePos !== null) {
      handleMove(currentMousePos);
    }
  }, [dragStart, isAxisLocked, currentMousePos]);

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

  function handleOnMouseMove(e: MouseEvent<HTMLDivElement>): void {
    resetIdle();
    /* If we aren't currently dragging, ignore the mouse move event */
    if (dragStart === null) {
      return;
    }

    const newMousePos = mouseToCanvasPoint(e);
    setCurrentMousePos(newMousePos);

    if ((e.buttons & 1) === 0 && dragStart !== null) {
      handleOnEnd();
      return;
    }
    handleMove(newMousePos);
  }

  function handleMove(p: Point) {
    if (transformStart !== null && dragStart !== null) {
      const dest = transformPoint(p, perspective);
      const tx = dest.x - dragStart.x;
      const ty = dest.y - dragStart.y;
      let vec = { x: tx, y: ty };
      if (isAxisLocked) {
        vec = toSingleAxisVector(vec);
      }
      transformer.setLocalTransform(translate(vec).mmul(transformStart));
    }
  }

  function handleOnStart(p: Point): void {
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
      className={`select-none ${visible(!isCalibrating)} bg-white dark:bg-black transition-all duration-500 w-screen h-screen`}
      onMouseMove={handleOnMouseMove}
      onMouseEnter={resetIdle}
      onMouseUp={handleOnEnd}
      onKeyUp={handleKeyUp}
      onKeyDown={handleKeyDown}
      style={{
        cursor: viewportCursorMode,
      }}
    >
      <div
        className={`select-none ${visible(!isCalibrating)}`}
        onMouseDown={(e) => {
          handleOnStart(mouseToCanvasPoint(e));
        }}
        onTouchMove={(e) => handleMove(touchToCanvasPoint(e))}
        onTouchStart={(e) => handleOnStart(touchToCanvasPoint(e))}
        onTouchEnd={handleOnEnd}
        onMouseUp={handleOnEnd}
        style={{
          cursor: cursorMode,
        }}
      >
        <div
          className={"absolute z-0"}
          style={{
            transform: `${matrix3d}`,
            transformOrigin: "0 0",
            imageRendering: "pixelated",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
