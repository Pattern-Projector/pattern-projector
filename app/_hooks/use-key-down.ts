import { useCallback, useEffect } from "react";
import { KeyCode } from "@/_lib/key-code";

export const useKeyDown = (
  callback: (e: KeyboardEvent) => void,
  keyCodes: KeyCode[],
) => {
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const keyDown = keyCodes.some((keyCode) => e.key === keyCode);

      if (keyDown) {
        e.preventDefault();
        callback(e);
      }
    },
    [keyCodes, callback],
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);
};
