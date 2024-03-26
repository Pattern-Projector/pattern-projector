import useProgArrowKeyHandler from "@/_hooks/useProgArrowKeyHandler";
import { applyOffset, Point } from "@/_lib/point";
import { translate } from "@/_lib/geometry";
import { useEffect, useMemo, useState } from "react";
import { Matrix } from "ml-matrix";

export default function useProgArrowKeyToMatrix(
  active: boolean,
  scale: number,
  applyChange: (matrix: Matrix) => void,
  ) {
  const PIXEL_LIST = [1, 10, 20, 100];
  const inverseScale = 1.0 / scale;
  function moveWithArrowKey(key: string, px: number) {
    let newOffset: Point = { x: 0, y: 0 };
    const dist = px*inverseScale;
    switch (key) {
      case "ArrowUp":
        newOffset = { y: -dist, x: 0 };
        break;
      case "ArrowDown":
        newOffset = { y: dist, x: 0 };
        break;
      case "ArrowLeft":
        newOffset = { y: 0, x: -dist };
        break;
      case "ArrowRight":
        newOffset = { y: 0, x: dist };
        break;
      default:
        break;
    }
    const m = translate(newOffset);
    applyChange(m);
  }

  useProgArrowKeyHandler(moveWithArrowKey, active, PIXEL_LIST, scale);
}
