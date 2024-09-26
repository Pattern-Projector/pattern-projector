import { RefObject, useEffect, useRef } from "react";

export default function useOnClickOutside(
  containerRef: RefObject<HTMLElement>,
  callback: () => void,
) {
  // Store callback in a ref so that we get a stable reference for the click handler
  const callbackRef = useRef<() => void>(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });
  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        callbackRef.current();
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [containerRef]);
}
