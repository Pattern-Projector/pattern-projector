import { useCallback, useEffect, useState } from "react";

const PIXEL_LIST = [2, 20, 50, 100];
export default function useProgArrowKeyHandler(
  handler: (key: string, px: number) => void,
  active: boolean,
  pixelList: number[] = PIXEL_LIST,
) {
  const [pixelIdx, setPixelIdx] = useState<number>(0);
  const [timeoutFunc, setTimeoutFunc] = useState<NodeJS.Timeout | null>();

  const keydownHandler = useCallback(
    function (e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
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
        handler(e.code, pixelList[pixelIdx]);
      }
    },
    [timeoutFunc, pixelIdx, handler, pixelList],
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
        document.addEventListener("keyup", keyupHandler);
      };
    }
  }, [keydownHandler, keyupHandler, active]);
}
