import { Matrix } from "ml-matrix";
import {
  Dispatch,
  MouseEvent,
  ReactNode,
  SetStateAction,
  useState,
} from "react";

import { transformPoint, translate } from "@/_lib/get-perspective-transform";
import Point from "@/_lib/interfaces/point";

export default function Draggable({
  children,
  localTransform,
  setLocalTransform,
  perspective,
}: {
  children: ReactNode;
  localTransform: Matrix;
  setLocalTransform: Dispatch<SetStateAction<Matrix>>;
  perspective: Matrix;
}) {
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [transformStart, setTransformStart] = useState<Matrix | null>(null);

  function handleOnMouseUp(e: MouseEvent<HTMLDivElement>): void {
    setDragStart(null);
    setTransformStart(null);
  }

  function handleOnMouseMove(e: MouseEvent<HTMLDivElement>): void {
    if (e.buttons & 1 && dragStart === null) {
      handleOnMouseDown(e);
      return;
    }

    if ((e.buttons & 1) === 0 && dragStart !== null) {
      handleOnMouseUp(e);
      return;
    }

    if (transformStart !== null && dragStart !== null) {
      var dest = transformPoint({ x: e.clientX, y: e.clientY }, perspective);
      var tx = dest.x - dragStart.x;
      var ty = dest.y - dragStart.y;
      let m = translate({ x: tx, y: ty });
      setLocalTransform(transformStart.mmul(m));
    }
  }

  function handleOnMouseDown(e: MouseEvent<HTMLDivElement>): void {
    var pt = transformPoint({ x: e.clientX, y: e.clientY }, perspective);
    setDragStart(pt);
    setTransformStart(localTransform.clone());
  }
  return (
    <div
      // https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/guides/preset-styles.md#phase-dragging-droppable-element
      className="cursor-grabbing select-none"
      onMouseMove={handleOnMouseMove}
    >
      {children}
    </div>
  );
}
