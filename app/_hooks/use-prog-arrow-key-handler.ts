import { KeyCode } from "@/_lib/key-code";
import { useCallback, useEffect, useRef } from "react";

export interface ArrowKeyGranularity {
  normal: number;
  shift: number;
  ctrl: number;
  alt: number;
  shiftCtrl: number;
  shiftAlt: number;
}

const DEFAULT_GRANULARITY: ArrowKeyGranularity = {
  normal: 1,
  shift: 10,
  ctrl: 0.1,
  alt: 0.5,
  shiftCtrl: 100,
  shiftAlt: 0.05,
};

const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 30;

interface Modifiers {
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
}

function granularityFromModifiers(m: Modifiers, g: ArrowKeyGranularity): number {
  if (m.shift && m.alt) return g.shiftAlt;
  if (m.shift && m.ctrl) return g.shiftCtrl;
  if (m.alt) return g.alt;
  if (m.ctrl) return g.ctrl;
  if (m.shift) return g.shift;
  return g.normal;
}

function isArrowCode(code: string): code is KeyCode {
  return (
    code === KeyCode.ArrowLeft ||
    code === KeyCode.ArrowUp ||
    code === KeyCode.ArrowRight ||
    code === KeyCode.ArrowDown
  );
}

function isModifierCode(code: string): boolean {
  return (
    code === "ShiftLeft" ||
    code === "ShiftRight" ||
    code === "ControlLeft" ||
    code === "ControlRight" ||
    code === "AltLeft" ||
    code === "AltRight"
  );
}

export default function useProgArrowKeyHandler(
  handler: (key: KeyCode, px: number, fullScreen: boolean) => void,
  active: boolean,
  fullScreen: boolean,
  granularity: ArrowKeyGranularity = DEFAULT_GRANULARITY,
) {
  const heldArrowsRef = useRef<Set<KeyCode>>(new Set());
  const modifiersRef = useRef<Modifiers>({ shift: false, ctrl: false, alt: false });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable refs so interval callbacks don't go stale
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const fullScreenRef = useRef(fullScreen);
  fullScreenRef.current = fullScreen;
  const granularityRef = useRef(granularity);
  granularityRef.current = granularity;

  const fire = useCallback(() => {
    const px = granularityFromModifiers(modifiersRef.current, granularityRef.current);
    heldArrowsRef.current.forEach((key) => {
      handlerRef.current(key, px, fullScreenRef.current);
    });
  }, []);

  const stopRepeat = useCallback(() => {
    if (delayRef.current !== null) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const ensureRepeatRunning = useCallback(() => {
    if (delayRef.current !== null || intervalRef.current !== null) return;
    delayRef.current = setTimeout(() => {
      delayRef.current = null;
      intervalRef.current = setInterval(fire, REPEAT_INTERVAL_MS);
    }, REPEAT_DELAY_MS);
  }, [fire]);

  const keyDownHandler = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;

    if (isArrowCode(e.code)) {
      e.preventDefault();
      if (e.repeat) return; // our interval handles repeating
      modifiersRef.current = { shift: e.shiftKey, ctrl: e.ctrlKey, alt: e.altKey };
      heldArrowsRef.current.add(e.code);
      fire();
      ensureRepeatRunning();
    } else if (isModifierCode(e.code) && heldArrowsRef.current.size > 0) {
      // Modifier added while arrow held — update state and fire once immediately.
      // The running interval will continue at the same rate with the new granularity.
      modifiersRef.current = { shift: e.shiftKey, ctrl: e.ctrlKey, alt: e.altKey };
      fire();
    }
  }, [fire, ensureRepeatRunning]);

  const keyUpHandler = useCallback((e: KeyboardEvent) => {
    if (isArrowCode(e.code)) {
      heldArrowsRef.current.delete(e.code);
      if (heldArrowsRef.current.size === 0) stopRepeat();
    } else if (isModifierCode(e.code) && heldArrowsRef.current.size > 0) {
      modifiersRef.current = { shift: e.shiftKey, ctrl: e.ctrlKey, alt: e.altKey };
    }
  }, [stopRepeat]);

  useEffect(() => {
    if (active) {
      document.addEventListener("keydown", keyDownHandler);
      document.addEventListener("keyup", keyUpHandler);
      const heldArrows = heldArrowsRef.current;
      return () => {
        document.removeEventListener("keydown", keyDownHandler);
        document.removeEventListener("keyup", keyUpHandler);
        stopRepeat();
        heldArrows.clear();
      };
    }
  }, [keyDownHandler, keyUpHandler, active, stopRepeat]);
}
