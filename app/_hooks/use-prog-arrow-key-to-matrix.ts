import useProgArrowKeyHandler from "@/_hooks/use-prog-arrow-key-handler";
import { Point } from "@/_lib/point";
import { translate } from "@/_lib/geometry";
import { Matrix } from "ml-matrix";

export default function useProgArrowKeyToMatrix(
  active: boolean,
  scale: number,
  applyChange: (matrix: Matrix) => void,
) {
  const PIXEL_LIST = [1, 2, 4];
  function moveWithArrowKey(key: string, px: number) {
    let newOffset: Point = { x: 0, y: 0 };
    const dist = px * scale;
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

  useProgArrowKeyHandler(moveWithArrowKey, active, PIXEL_LIST, false);
}
