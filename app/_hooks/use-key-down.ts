import { useCallback, useEffect } from 'react';
import { KeyCode } from '@/_lib/key-code';

export const useKeyDown = (callback: (T?: any) => void, keyCodes: KeyCode[]) => {
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    const keyDown = keyCodes.some((keyCode) => e.code === keyCode);

    if (keyDown) {
      e.preventDefault();
      callback();
    }
  }, [keyCodes, callback]);

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);
};