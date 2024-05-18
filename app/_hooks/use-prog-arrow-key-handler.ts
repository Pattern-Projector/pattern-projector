import { KeyCode } from "@/_lib/key-code";
import { useCallback, useEffect, useState } from "react";

const PIXEL_LIST = [1, 10, 20, 40];
export default function useProgArrowKeyHandler(
  handler: (key: KeyCode, px: number, fullScreen: boolean) => void,
  active: boolean,
  pixelList: number[] = PIXEL_LIST,
  fullScreen: boolean,
) {
  const [pixelIdx, setPixelIdx] = useState<number>(0);
  const [timeoutFunc, setTimeoutFunc] = useState<NodeJS.Timeout | null>();

  const keydownHandler = useCallback(
    function (e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.code) {
        case KeyCode.ArrowLeft:
        case KeyCode.ArrowUp:
        case KeyCode.ArrowRight:
        case KeyCode.ArrowDown:
          e.preventDefault();
          if (!timeoutFunc && pixelIdx < pixelList.length - 1) {
            setTimeoutFunc(
              setTimeout(() => {
                setPixelIdx(pixelIdx + 1);
                setTimeoutFunc(null);
              }, 600),
            );
          }
          handler(e.code, pixelList[pixelIdx], fullScreen);
          break;
        default:
          break;
      }
    },
    [timeoutFunc, pixelIdx, handler, pixelList, fullScreen],
  );

  const keyupHandler = useCallback(
    function () {
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
        document.removeEventListener("keyup", keyupHandler);
      };
    }
  }, [keydownHandler, keyupHandler, active]);
}
