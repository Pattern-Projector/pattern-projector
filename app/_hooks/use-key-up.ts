import { useCallback, useEffect } from "react";
import { KeyCode } from "@/_lib/key-code";

export const useKeyUp = (callback: (T?: any) => void, keyCodes: KeyCode[]) => {
  const onKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const keyUp = keyCodes.some((keyCode) => e.key === keyCode);

      if (keyUp) {
        e.preventDefault();
        callback();
      }
    },
    [keyCodes, callback],
  );

  useEffect(() => {
    document.addEventListener("keyup", onKeyUp);

    return () => {
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [onKeyUp]);
};
