import useProgArrowKeyHandler from "@/_hooks/useProgArrowKeyHandler";
import { applyOffset, Point } from "@/_lib/point";
import { translate } from "@/_lib/geometry";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { Matrix } from "ml-matrix";
import { KeyCode } from "@/_lib/key-code";

export default function useProgArrowKeyPoints(
  points: Point[],
  setPoints: Dispatch<SetStateAction<Point[]>>,
  pointToModify: number | null,
  active: boolean,
) {
  function getNewOffset(key: KeyCode, px: number) {
    if (pointToModify !== null) {
      const newPoints = [...points];
      let newPoint: Point = points[pointToModify];
      switch (key) {
        case KeyCode.ArrowUp:
          newPoint = applyOffset(points[pointToModify], { y: -px, x: 0 });
          break;
        case KeyCode.ArrowDown:
          newPoint = applyOffset(points[pointToModify], { y: px, x: 0 });
          break;
        case KeyCode.ArrowLeft:
          newPoint = applyOffset(points[pointToModify], { y: 0, x: -px });
          break;
        case KeyCode.ArrowRight:
          newPoint = applyOffset(points[pointToModify], { y: 0, x: px });
          break;
        default:
          break;
      }
      newPoints[pointToModify] = newPoint;
      setPoints(newPoints);
    }
  }

  useProgArrowKeyHandler(
    getNewOffset,
    pointToModify !== null && active,
    [1, 3, 5, 10],
  );

  return null;
}
