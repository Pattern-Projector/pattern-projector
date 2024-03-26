import { useCallback, useEffect, useState } from "react";
import { useKeyDown } from "@/_hooks/use-key-down";
import { useKeyUp } from "@/_hooks/use-key-up";
import { KeyCode } from "@/_lib/key-code";

const PIXEL_LIST = [2, 20, 50, 100];
export default function useProgArrowKeyHandler(
  handler: (key: KeyCode, px: number) => void,
  active: boolean,
  pixelList: number[] = PIXEL_LIST,
  modifierScale: number = 16,
) {
  const [pixelIdx, setPixelIdx] = useState<number>(0);
  const [timeoutFunc, setTimeoutFunc] = useState<NodeJS.Timeout | null>();
  const [shiftPressed, setShiftPressed] = useState<boolean>(false);

  const arrowKeyHandler = useCallback(
    function (keycode: KeyCode) {
      if (!timeoutFunc && pixelIdx < pixelList.length - 1) {
        setTimeoutFunc(
          setTimeout(() => {
            setPixelIdx(pixelIdx + 1);
            setTimeoutFunc(null);
          }, 600),
        );
      }
      const pixelValue = shiftPressed
        ? pixelList[pixelIdx] * modifierScale
        : pixelList[pixelIdx];
      handler(keycode, pixelValue);
    },
    [timeoutFunc, pixelIdx, handler, pixelList, shiftPressed],
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

  useKeyDown(() => {
    setShiftPressed(true);
  }, [KeyCode.ShiftLeft]);

  useKeyDown(() => {
    arrowKeyHandler(KeyCode.ArrowUp);
  }, [KeyCode.ArrowUp]);

  useKeyDown(() => {
    arrowKeyHandler(KeyCode.ArrowDown);
  }, [KeyCode.ArrowDown]);

  useKeyDown(() => {
    arrowKeyHandler(KeyCode.ArrowLeft);
  }, [KeyCode.ArrowLeft]);

  useKeyDown(() => {
    arrowKeyHandler(KeyCode.ArrowRight);
  }, [KeyCode.ArrowRight]);

  useKeyUp(() => {
    setShiftPressed(false);
  }, [KeyCode.ShiftLeft]);

  useKeyUp(() => {
    keyupHandler();
  }, [
    KeyCode.ArrowUp,
    KeyCode.ArrowDown,
    KeyCode.ArrowLeft,
    KeyCode.ArrowRight,
  ]);
}
