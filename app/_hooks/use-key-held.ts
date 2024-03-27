import { useEffect, useRef, useCallback, Dispatch } from "react";
import { KeyCode } from "@/_lib/key-code";
import { useKeyDown } from "./use-key-down";
import { useKeyUp } from "./use-key-up";

export const useKeyHeld = (
  areKeysHeldRefOrDispatch: React.MutableRefObject<boolean> | Dispatch<boolean>,
  keyCodes: KeyCode[],
) => {
  const heldKeys = useRef<Set<KeyCode>>(new Set());

  useKeyDown((keyCode) => {
    heldKeys.current.add(keyCode);
    update();
  }, keyCodes);

  useKeyUp((keyCode) => {
    heldKeys.current.delete(keyCode);
    update();
  }, keyCodes);

  const update = useCallback(() => {
    const areKeysHeld = keyCodes.every((keyCode) => heldKeys.current.has(keyCode));

    if (areKeysHeldRefOrDispatch instanceof Function) {
      areKeysHeldRefOrDispatch(areKeysHeld);
    } else {
      areKeysHeldRefOrDispatch.current = areKeysHeld;
    }
  }, [keyCodes, areKeysHeldRefOrDispatch]);
};
