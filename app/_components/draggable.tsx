import { Matrix } from "ml-matrix";
import {
  Dispatch,
  LegacyRef,
  MouseEvent,
  ReactNode,
  SetStateAction,
  useState,
  useEffect,
} from "react";

import { transformPoint, translate } from "@/_lib/geometry";
import { mouseToCanvasPoint, Point, touchToCanvasPoint } from "@/_lib/point";

export default function Draggable({
  children,
  className,
  localTransform,
  setLocalTransform,
  perspective,
}: {
  children: ReactNode;
  className: string | undefined;
  localTransform: Matrix;
  setLocalTransform: Dispatch<SetStateAction<Matrix>>;
  perspective: Matrix;
}) {
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [transformStart, setTransformStart] = useState<Matrix | null>(null);
  const [isAxisLocked, setIsAxisLocked] = useState<Boolean>(false);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const AXIS_LOCK_KEYBIND = 'Control';

  /* Keep track of which keys are being pressed */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setPressedKeys(prev => new Set(prev.add(event.key)));
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(event.key);
        return newSet;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  /* Update isAxisLocked based on its keybind */
  useEffect(() => {
    setIsAxisLocked(pressedKeys.has(AXIS_LOCK_KEYBIND));
  }, [pressedKeys]); 

  function handleOnEnd(): void {
    setDragStart(null);
    setTransformStart(null);
  }

  function handleOnMouseMove(e: MouseEvent<HTMLDivElement>): void {
    if (e.buttons & 1 && dragStart === null) {
      handleOnStart(mouseToCanvasPoint(e));
      return;
    }

    if ((e.buttons & 1) === 0 && dragStart !== null) {
      handleOnEnd();
      return;
    }
    handleMove(mouseToCanvasPoint(e));
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
      const dest = transformPoint(p, perspective);
      const tx = dest.x - dragStart.x;
      const ty = dest.y - dragStart.y;
      var vec = {x: tx, y:ty};
      if (isAxisLocked){
        vec = toSingleAxisVector(vec);
      }
      let m = translate(vec);
      setLocalTransform(transformStart.mmul(m));
    }
  }

  function handleOnStart(p: Point): void {
    var pt = transformPoint(p, perspective);
    setDragStart(pt);
    setTransformStart(localTransform.clone());
  }

  return (
    <div
      className={className}
      onMouseMove={handleOnMouseMove}
      onTouchMove={(e) => handleMove(touchToCanvasPoint(e))}
      onTouchStart={(e) => handleOnStart(touchToCanvasPoint(e))}
      onTouchEnd={handleOnEnd}
      // TODO: consider theses style={{ mixBlendMode: "hard-light" }}
    >
      {children}
    </div>
  );
}
