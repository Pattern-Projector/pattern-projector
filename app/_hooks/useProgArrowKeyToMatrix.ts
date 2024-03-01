import useProgArrowKeyHandler from "@/_hooks/useProgArrowKeyHandler";
import { applyOffset, Point } from "@/_lib/point";
import { translate } from "@/_lib/geometry";
import { useEffect, useMemo, useState } from "react";
import { Matrix } from "ml-matrix";

export default function useProgArrowKeyToMatrix(active: boolean) {
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const translation: Matrix = useMemo(() => {
    return translate(offset);
  }, [offset]);

  function moveWithArrowKey(key: string, px: number) {
    let newOffset: Point = { x: 0, y: 0 };
    switch (key) {
      case "ArrowUp":
        newOffset = applyOffset(offset, { y: -px, x: 0 });
        break;
      case "ArrowDown":
        newOffset = applyOffset(offset, { y: px, x: 0 });
        break;
      case "ArrowLeft":
        newOffset = applyOffset(offset, { y: 0, x: -px });
        break;
      case "ArrowRight":
        newOffset = applyOffset(offset, { y: 0, x: px });
        break;
      default:
        break;
    }
    setOffset(newOffset);
  }

  useProgArrowKeyHandler(moveWithArrowKey, active);

  return translation;
}
