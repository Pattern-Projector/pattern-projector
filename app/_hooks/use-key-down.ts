import { useCallback, useEffect } from "react";
import { KeyCode } from "@/_lib/key-code";

export const useKeyDown = (
  callback: (e: KeyboardEvent) => void,
  keyCodes: KeyCode[],
) => {
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const keyDown = keyCodes.some((keyCode) => e.key === keyCode);

      // Let people type in text fields, such as when renaming a project
      if (isTextField(e.target)) {
        return;
      }

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

function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable || target instanceof HTMLTextAreaElement) {
    return true;
  }
  return (
    target instanceof HTMLInputElement &&
    !["button", "checkbox", "radio", "range", "submit"].includes(target.type)
  );
}
