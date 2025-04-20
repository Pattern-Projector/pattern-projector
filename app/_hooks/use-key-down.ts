import { useCallback, useEffect } from "react";
import { KeyCode } from "@/_lib/key-code";

export const useKeyDown = (
  callback: (e: KeyboardEvent) => void,
  keyCodes: KeyCode[],
) => {
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const keyDown = keyCodes.some((keyCode) => e.key === keyCode);

      // Only intercept keydown events when no modifier keys are pressed to prevent issues like CTRL-V not working #369
      // Removing shiftKey because it is used for snapping when using the line tool
      if (keyDown && !e.ctrlKey && !e.metaKey && !e.altKey) {
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
