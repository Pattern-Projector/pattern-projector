import { useCallback, useEffect } from 'react';
import { KeyCode } from '@/_lib/key-code';

export const useKeyUp = (
  callback: ((keyCode: KeyCode) => void) | (() => void),
  keyCodes: KeyCode[]
) => {
  const onKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const keyUp = keyCodes.some((keyCode) => e.code === keyCode);

      if (keyUp) {
        e.preventDefault();
        const releasedKeyCode = e.code as KeyCode;

        if (callback.length === 1) {
          (callback as (keyCode: KeyCode) => void)(releasedKeyCode);
        } else {
          (callback as () => void)();
        }
      }
    },
    [keyCodes, callback]
  );

  useEffect(() => {
    document.addEventListener('keyup', onKeyUp);

    return () => {
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [onKeyUp]);
};
