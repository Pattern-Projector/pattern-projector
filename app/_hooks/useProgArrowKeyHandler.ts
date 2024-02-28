import { useCallback, useEffect, useState } from "react";

const PIXEL_LIST = [1, 10, 25, 50];
export default function useProgArrowKeyHandler(
  handler: (key: string, px: number) => void,
  active: boolean,
) {
  const [pixelIdx, setPixelIdx] = useState<number>(0);
  const [timeoutFunc, setTimeoutFunc] = useState<NodeJS.Timeout | null>();

  const keydownHandler = useCallback(
    function (e: KeyboardEvent) {
      e.preventDefault();
      if (!timeoutFunc && pixelIdx < PIXEL_LIST.length - 1) {
        console.log("keydown timeout");
        setTimeoutFunc(
          setTimeout(() => {
            setPixelIdx(pixelIdx + 1);
            setTimeoutFunc(null);
          }, 600),
        );
      }
      if (
        ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(e.code)
      ) {
        handler(e.code, PIXEL_LIST[pixelIdx]);
      }
    },
    [timeoutFunc, pixelIdx, handler],
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
