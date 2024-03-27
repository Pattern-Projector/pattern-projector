import { useEffect, useRef, useCallback } from "react";
import { KeyCode } from "@/_lib/key-code";
import { useKeyDown } from "./use-key-down";
import { useKeyUp } from "./use-key-up";

export const useKeyHeld = (
  areKeysHeldRef: React.MutableRefObject<boolean>,
  keyCodes: KeyCode[],
) => {
  const heldKeys = useRef<Set<KeyCode>>(new Set());

  useKeyDown((keyCode) => {
      heldKeys.current.add(keyCode);
      update();
  }, keyCodes);

  useKeyUp((keyCode) => {
    heldKeys.current.delete(keyCode)
    update();
  }, keyCodes);

  const update = useCallback(() => {
    areKeysHeldRef.current = keyCodes.every((keyCode) => heldKeys.current.has(keyCode));
  },[ keyCodes, areKeysHeldRef ])

};
