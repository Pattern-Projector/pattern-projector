import { Matrix, inverse} from "ml-matrix";
import { getPtDensity } from "@/_lib/unit";
import {
  Dispatch,
  LegacyRef,
  ReactNode,
  SetStateAction,
  MouseEvent,
  useState,
  useRef,
  useEffect,
  useCallback
} from "react";

import {
  transformPoint,
  translate,
} from "@/_lib/geometry";
import { mouseToCanvasPoint, Point, touchToCanvasPoint, nativeMouseToCanvasPoint} from "@/_lib/point";
import { TransformSettings } from "@/_lib/transform-settings";

export default function Draggable({
  children,
  className,
  viewportClassName,
  transformSettings,
  setTransformSettings,
  perspective,
  unitOfMeasure,
}: {
  children: ReactNode;
  className: string | undefined;
  viewportClassName: string | undefined;
  transformSettings: TransformSettings;
  setTransformSettings: Dispatch<SetStateAction<TransformSettings>>;
  perspective: Matrix;
  unitOfMeasure: string;
}) {
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<Point | null>(null);
  const [transformStart, setTransformStart] = useState<Matrix | null>(null);
  const [isAxisLocked, setIsAxisLocked] = useState<Boolean>(false);
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const AXIS_LOCK_KEYBIND = 'Shift';
  const IDLE_TIMEOUT = 1500;

  const handleKeyDown = useCallback(
    function (e: React.KeyboardEvent) {
      if (e.key === AXIS_LOCK_KEYBIND) {
        e.preventDefault();
        setIsAxisLocked(true);
      } 
    },
    [
      setIsAxisLocked,
    ],
  );

  const handleKeyUp = useCallback(
    function (e: React.KeyboardEvent) {
      if (e.key === AXIS_LOCK_KEYBIND) {
        e.preventDefault();
        setIsAxisLocked(false);
      } 
    },
    [
      setIsAxisLocked,
    ],
  );

  /* This effect causes the position of the div to update instantly if
   isAxisLocked changes, rather than needing the mouse to move first */
  useEffect(() => {
    if (dragStart !==null && isAxisLocked && currentMousePos !== null) {
      handleMove(currentMousePos);
    }
  }, [dragStart, isAxisLocked, currentMousePos]);

  function resetIdle() {
    setIsIdle(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(()=>{setIsIdle(true)}, IDLE_TIMEOUT);
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

    const newMousePos = mouseToCanvasPoint(e)
    setCurrentMousePos(newMousePos)

    if ((e.buttons & 1) === 0 && dragStart !== null) {
      handleOnEnd();
      return;
    }
    handleMove(newMousePos);
  }

  function toSingleAxisVector(vec: Point): Point{
    if (Math.abs(vec.x) > Math.abs(vec.y)){
      return {x: vec.x, y:0} 
    } else {
      return {x: 0, y:vec.y} 
    }
  }

  function handleMove(p: Point) {
    if (transformStart !== null && dragStart !== null) {
      const ptDensity = getPtDensity(unitOfMeasure);
      const dest = transformPoint(p, perspective);
      const tx = dest.x - dragStart.x;
      const ty = dest.y - dragStart.y;
      let vec = {x: tx/ptDensity, y:ty/ptDensity};
      if (isAxisLocked){
        vec = toSingleAxisVector(vec);
      }
      const m = translate(vec);
      const newTransformMatrix = m.mmul(transformStart);
      setTransformSettings({
       ...transformSettings,
        matrix: newTransformMatrix,
      })
    }
  }

  function handleOnStart(p: Point): void {
    var pt = transformPoint(p, perspective);
    setDragStart(pt);
    setTransformStart(transformSettings.matrix.clone());
  }

  let cursorMode = `${dragStart !== null ? 'grabbing' : 'grab'}`;
  let viewportCursorMode = `${dragStart !== null ? 'grabbing': 'default'}`;

  /* If we aren't dragging and the idle timer has set isIdle
   * to true, hide the cursor */
  if (dragStart === null && isIdle) {
    cursorMode = 'none';
    viewportCursorMode = 'none';
  }

  return (
    <div
      tabIndex={0}
      className={viewportClassName + " w-screen h-screen "}
      onMouseMove={handleOnMouseMove}
      onMouseEnter={resetIdle}
      onMouseUp={handleOnEnd}
      onKeyUp={handleKeyUp}
      onKeyDown={handleKeyDown}
      style={{
        cursor:viewportCursorMode
      }}
    >
      <div
        className={className}
        onMouseDown={(e) => {handleOnStart(mouseToCanvasPoint(e))}}
        onTouchMove={(e) => handleMove(touchToCanvasPoint(e))}
        onTouchStart={(e) => handleOnStart(touchToCanvasPoint(e))}
        onTouchEnd={handleOnEnd}
        onMouseUp={handleOnEnd}
        style={{
          cursor:cursorMode
        }}
        // TODO: consider theses style={{ mixBlendMode: "hard-light" }}
      >
        {children}
      </div>
    </div>
  );
}
