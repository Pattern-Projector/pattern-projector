import useProgArrowKeyHandler from "@/_hooks/useProgArrowKeyHandler";
import { applyOffset, Point } from "@/_lib/point";
import { Dispatch, SetStateAction } from "react";

export default function useProgArrowKeyPoints(
  points: Point[],
  setPoints: Dispatch<SetStateAction<Point[]>>,
  corners: Set<number>,
  active: boolean,
) {
  function getNewOffset(key: string, px: number) {
    if (corners.size) {
      const newPoints = [...points];
      for (const pointToModify of corners) {
      let newPoint = points[pointToModify];
      switch (key) {
        case "ArrowUp":
          newPoint = applyOffset(newPoint, { y: -px, x: 0 });
          break;
        case "ArrowDown":
          newPoint = applyOffset(newPoint, { y: px, x: 0 });
          break;
        case "ArrowLeft":
          newPoint = applyOffset(newPoint, { y: 0, x: -px });
          break;
        case "ArrowRight":
          newPoint = applyOffset(newPoint, { y: 0, x: px });
          break;
        default:
          break;
      }
      newPoints[pointToModify] = newPoint;
    }
      setPoints(newPoints);
    }
  }

  useProgArrowKeyHandler(
    getNewOffset,
    corners.size > 0 && active,
    [1, 3, 5, 10],
  );

  return null;
}
