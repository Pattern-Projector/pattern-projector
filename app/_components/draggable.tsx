import { Matrix } from "ml-matrix";
import {
  Dispatch,
  MouseEvent,
  ReactNode,
  SetStateAction,
  useState,
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

  function handleMove(p: Point) {
    if (transformStart !== null && dragStart !== null) {
      var dest = transformPoint(p, perspective);
      var tx = dest.x - dragStart.x;
      var ty = dest.y - dragStart.y;
      let m = translate({ x: tx, y: ty });
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
