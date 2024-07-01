import { Matrix } from "ml-matrix";
import {
  ReactNode,
  useState,
  useEffect,
  SetStateAction,
  Dispatch,
} from "react";

import {
  RestoreTransforms,
  toMatrix3d,
  transformPoint,
  translate,
  scale,
  scaleAboutPoint,
} from "@/_lib/geometry";
import { Point } from "@/_lib/point";
import { CSS_PIXELS_PER_INCH } from "@/_lib/pixels-per-inch";
import { IN } from "@/_lib/unit";
import useProgArrowKeyToMatrix from "@/_hooks/use-prog-arrow-key-to-matrix";
import { visible } from "./theme/css-functions";
import {
  useTransformContext,
  useTransformerContext,
} from "@/_hooks/use-transform-context";
import { MenuStates } from "@/_lib/menu-states";
import { inverse } from "ml-matrix";

export default function Draggable({
  children,
  perspective,
  isCalibrating,
  unitOfMeasure,
  calibrationTransform,
  setCalibrationTransform,
  setPerspective,
  className,
  magnifying,
  restoreTransforms,
  setRestoreTransforms,
  zoomedOut,
  setZoomedOut,
  layoutWidth,
  layoutHeight,
  calibrationCenter,
  menuStates,
}: {
  children: ReactNode;
  perspective: Matrix;
  isCalibrating: boolean;
  unitOfMeasure: string;
  calibrationTransform: Matrix;
  setCalibrationTransform: Dispatch<SetStateAction<Matrix>>;
  setPerspective: Dispatch<SetStateAction<Matrix>>;
  className: string;
  magnifying: boolean;
  setRestoreTransforms: Dispatch<SetStateAction<RestoreTransforms | null>>;
  restoreTransforms: RestoreTransforms | null;
  zoomedOut: boolean;
  setZoomedOut: Dispatch<SetStateAction<boolean>>;
  layoutWidth: number;
  layoutHeight: number;
  calibrationCenter: Point;
  menuStates: MenuStates;
}) {
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [transformStart, setTransformStart] = useState<Matrix | null>(null);

  const [matrix3d, setMatrix3d] = useState<string>("");

  const transform = useTransformContext();
  const transformer = useTransformerContext();

  const quarterInchPx = CSS_PIXELS_PER_INCH / 4;
  const halfCmPx = CSS_PIXELS_PER_INCH / 2.54 / 2;

  useProgArrowKeyToMatrix(
    !isCalibrating,
    unitOfMeasure === IN ? quarterInchPx : halfCmPx,
    (matrix) => {
      transformer.setLocalTransform(matrix.mmul(transform));
    },
  );

  useEffect(() => {
    setMatrix3d(toMatrix3d(calibrationTransform.mmul(transform)));
  }, [transform, calibrationTransform]);

  function handleOnEnd(): void {
    setDragStart(null);
    setTransformStart(null);
  }

  function handleMove(e: React.PointerEvent) {
    const p = { x: e.clientX, y: e.clientY };

    if (e.pointerType === "mouse") {
      /* If we aren't currently dragging, ignore the mouse move event */
      if (dragStart === null) {
        return;
      }
      if (e.buttons === 0 && dragStart !== null) {
        // If the mouse button is released, end the drag.
        handleOnEnd();
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
    if (magnifying) {
      setRestoreTransforms({
        localTransform: transform.clone(),
        calibrationTransform: calibrationTransform.clone(),
      });
      transformer.magnify(5, pt);
      setDragStart(pt);
      setTransformStart(scaleAboutPoint(5, pt).mmul(transform));
    } else if (restoreTransforms !== null) {
      const dest = transformPoint(p, perspective);
      const newLocal = translate({
        x: -dest.x + calibrationCenter.x,
        y: -dest.y + calibrationCenter.y,
      });
      setRestoreTransforms({
        localTransform: newLocal,
        calibrationTransform: restoreTransforms.calibrationTransform.clone(),
      });
      setZoomedOut(false);
    } else {
      setDragStart(pt);
      setTransformStart(transform.clone());
    }
  }

  const cursorMode = `${dragStart !== null ? "grabbing" : magnifying || zoomedOut ? "zoom-in" : "grab"}`;
  const viewportCursorMode = `${dragStart !== null ? "grabbing" : "default"}`;

  useEffect(() => {
    if (zoomedOut && restoreTransforms === null) {
      setRestoreTransforms({
        localTransform: transform.clone(),
        calibrationTransform: calibrationTransform.clone(),
      });
      const layerMenuWidth = 190;
      const stitchMenuHeight = 81;
      const navHeight = 64;
      const x = menuStates.layers ? layerMenuWidth : 0;
      const y = menuStates.stitch ? navHeight + stitchMenuHeight : navHeight;
      const s = Math.min(
        (window.innerWidth - x) / layoutWidth,
        (window.innerHeight - y) / layoutHeight,
      );
      const scaledTransform = scale(s);
      const movedTransform = translate({ x, y });
      const zoomOut = movedTransform.mmul(scaledTransform);

      setCalibrationTransform(zoomOut.clone());
      setPerspective(inverse(zoomOut.clone()));
      transformer.setLocalTransform(Matrix.identity(3));
    }
  }, [
    zoomedOut,
    setZoomedOut,
    transform,
    transformer,
    layoutWidth,
    layoutHeight,
    restoreTransforms,
    menuStates,
    setCalibrationTransform,
    setPerspective,
    calibrationTransform,
    setRestoreTransforms,
  ]);

  useEffect(() => {
    if (!magnifying && !zoomedOut && restoreTransforms !== null) {
      transformer.setLocalTransform(restoreTransforms.localTransform);
      setCalibrationTransform(restoreTransforms.calibrationTransform);
      setPerspective(inverse(restoreTransforms.calibrationTransform));
      setRestoreTransforms(null);
    }
  }, [
    magnifying,
    zoomedOut,
    restoreTransforms,
    setRestoreTransforms,
    setCalibrationTransform,
    transformer,
    setPerspective,
  ]);

  return (
    <div
      tabIndex={0}
      className={`${className ?? ""} select-none absolute top-0 ${visible(!isCalibrating)} bg-white dark:bg-black transition-all duration-500 w-screen h-screen`}
      onPointerMove={handleMove}
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
