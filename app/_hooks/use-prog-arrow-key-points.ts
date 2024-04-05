import useProgArrowKeyHandler from "@/_hooks/use-prog-arrow-key-handler";
import { KeyCode } from "@/_lib/key-code";
import { Point } from "@/_lib/point";
import { PointAction } from "@/_reducers/pointsReducer";
import { Dispatch } from "react";

export default function useProgArrowKeyPoints(
  dispatch: Dispatch<PointAction>,
  corners: Set<number>,
  active: boolean,
) {
  function getOffset(key: KeyCode, px: number): Point {
    switch (key) {
      case KeyCode.ArrowUp:
        return { y: -px, x: 0 };
      case KeyCode.ArrowDown:
        return { y: px, x: 0 };
      case KeyCode.ArrowLeft:
        return { y: 0, x: -px };
      case KeyCode.ArrowRight:
        return { y: 0, x: px };
      default:
        return { x: 0, y: 0 };
    }
  }

  function getNewOffset(key: KeyCode, px: number) {
    if (corners.size) {
      dispatch({ type: "offset", offset: getOffset(key, px), corners });
    }
  }

  useProgArrowKeyHandler(
    getNewOffset,
    corners.size > 0 && active,
    [1, 3, 5, 10],
  );

  return null;
}
