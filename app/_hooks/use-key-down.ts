import { useCallback, useEffect } from 'react';
import { KeyCode } from '@/_lib/key-code';

export const useKeyDown = (
  callback: ((keyCode: KeyCode) => void) | (() => void),
  keyCodes: KeyCode[]
) => {
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const keyDown = keyCodes.some((keyCode) => e.code === keyCode);

      if (keyDown) {
        e.preventDefault();
        const pressedKeyCode = e.code as KeyCode;

        if (callback.length === 1) {
          (callback as (keyCode: KeyCode) => void)(pressedKeyCode);
        } else {
          (callback as () => void)();
        }
      }
    },
    [keyCodes, callback]
  );

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);
};
