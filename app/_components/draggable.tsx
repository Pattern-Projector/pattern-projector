import { Matrix } from "ml-matrix";
import {
  Dispatch,
  LegacyRef,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  SetStateAction,
  useState,
  useEffect,
} from "react";

import { transformPoint, translate } from "@/_lib/geometry";
import { mouseToCanvasPoint, Point, touchToCanvasPoint, nativeMouseToCanvasPoint} from "@/_lib/point";

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
  const [currentMousePos, setCurrentMousePos] = useState<Point | null>(null);
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

  /* This effect allows for the mouse to move the element
     even if it is no longer hovering on it */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleMove(nativeMouseToCanvasPoint(e));
    };
    if (dragStart !== null ) {
      // Attach global event listeners when dragging starts
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleOnEnd);
    }

    // Cleanup global event listeners on component unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleOnEnd);
    };
  }, [dragStart, isAxisLocked]); // Re-run effect if isDragging changes or isAxisLocked changes

  /* Update the currentMousePos every time the mouse moves */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newMousePos = nativeMouseToCanvasPoint(e);
      setCurrentMousePos(newMousePos);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []); // Empty dependency array means this only runs once on mount

  /* This effect causes the position of the div to update instantly if
     isAxisLocked changes, rather than needing the mouse to move first */
  useEffect(() => {
    if (dragStart !==null && isAxisLocked && currentMousePos !== null) {
      handleMove(currentMousePos);
    }
  }, [dragStart, isAxisLocked, currentMousePos]);

  function handleOnEnd(): void {
    setDragStart(null);
    setTransformStart(null);
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
      let vec = {x: tx, y:ty};
      if (isAxisLocked){
        vec = toSingleAxisVector(vec);
      }
      const m = translate(vec);
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
      onMouseDown={(e) => handleOnStart(mouseToCanvasPoint(e))}
      onTouchMove={(e) => handleMove(touchToCanvasPoint(e))}
      onTouchStart={(e) => handleOnStart(touchToCanvasPoint(e))}
      onTouchEnd={handleOnEnd}
      // TODO: consider theses style={{ mixBlendMode: "hard-light" }}
    >
      {children}
    </div>
  );
}
