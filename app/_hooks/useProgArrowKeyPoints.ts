import useProgArrowKeyHandler from "@/_hooks/useProgArrowKeyHandler";
import { applyOffset, Point } from "@/_lib/point";
import { translate } from "@/_lib/geometry";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { Matrix } from "ml-matrix";

export default function useProgArrowKeyPoints(
  points: Point[],
  setPoints: Dispatch<SetStateAction<Point[]>>,
  pointToModify: number | null,
  active: boolean,
) {
  function getNewOffset(key: string, px: number) {
    if (pointToModify !== null) {
      const newPoints = [...points];
      let newPoint: Point = points[pointToModify];
      switch (key) {
        case "ArrowUp":
          newPoint = applyOffset(points[pointToModify], { y: -px, x: 0 });
          break;
        case "ArrowDown":
          newPoint = applyOffset(points[pointToModify], { y: px, x: 0 });
          break;
        case "ArrowLeft":
          newPoint = applyOffset(points[pointToModify], { y: 0, x: -px });
          break;
        case "ArrowRight":
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
