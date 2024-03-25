import { useCallback, useEffect, useState } from "react";

const PIXEL_LIST = [2, 20, 50, 100];
export default function useProgArrowKeyHandler(
  handler: (key: string, px: number) => void,
  active: boolean,
  pixelList: number[] = PIXEL_LIST,
  modifierScale?: number
) {
  const [pixelIdx, setPixelIdx] = useState<number>(0);
  const [timeoutFunc, setTimeoutFunc] = useState<NodeJS.Timeout | null>();
  const [shiftPressed, setShiftPressed] = useState<boolean>(false);
  const scale = modifierScale !== undefined ? modifierScale : 16;

  const keydownHandler = useCallback(
    function (e: KeyboardEvent) {
      if (e.shiftKey) {
        setShiftPressed(true);
      }
      if (
        ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(e.code)
      ) {
        e.preventDefault();
        if (!timeoutFunc && pixelIdx < pixelList.length - 1) {
          setTimeoutFunc(
            setTimeout(() => {
              setPixelIdx(pixelIdx + 1);
              setTimeoutFunc(null);
            }, 600),
          );
        }
        const pixelValue = shiftPressed ? pixelList[pixelIdx] * scale : pixelList[pixelIdx];
        handler(e.code, pixelValue);
      }
    },
    [timeoutFunc, pixelIdx, handler, pixelList, shiftPressed],
  );

  const keyupHandler = useCallback(
    function (e: KeyboardEvent) {
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        setShiftPressed(false);
      }
      if (timeoutFunc) {
        clearTimeout(timeoutFunc);
        setTimeoutFunc(null);
      }
      setPixelIdx(0);
    },
    [timeoutFunc],
  );

  useEffect(() => {
    if (active) {
      document.addEventListener("keydown", keydownHandler);
      document.addEventListener("keyup", keyupHandler);
      return () => {
        document.removeEventListener("keydown", keydownHandler);
        document.addEventListener("keyup", keyupHandler);
      };
    }
  }, [keydownHandler, keyupHandler, active]);
}
