import { useEffect, useRef, useCallback, Dispatch } from "react";
import { KeyCode } from "@/_lib/key-code";
import { useKeyDown } from "./use-key-down";

export const useKeyToggle = (
  anyKeyRefOrDispatch: React.MutableRefObject<boolean> | Dispatch<boolean>,
  keyCodes: KeyCode[],
) => {
  const toggledKeys = useRef<Set<KeyCode>>(new Set());

  useKeyDown((keyCode) => {
    if (toggledKeys.current.has(keyCode))
      toggledKeys.current.delete(keyCode);
    else
      toggledKeys.current.add(keyCode);
    update();
  }, keyCodes);

  const update = useCallback(() => {
    const anyKeyToggled = keyCodes.some((keyCode) => toggledKeys.current.has(keyCode));

    if (anyKeyRefOrDispatch instanceof Function) {
      anyKeyRefOrDispatch(anyKeyToggled);
    } else {
      anyKeyRefOrDispatch.current = anyKeyToggled;
    }
  }, [keyCodes, anyKeyRefOrDispatch]);
};
