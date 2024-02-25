import {
  FocusEvent,
  FocusEventHandler,
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { document } from "postcss";
import doc = Mocha.reporters.doc;

export function Dropdown({
  position,
  children,
  open,
  onClose,
}: {
  position?: string;
  children?: any;
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleClickAway = useCallback(
    (event: any) => {
      if (open && !ref?.current?.contains(event.target)) {
        onClose();
      }
    },
    [open, onClose],
  );

  useEffect(() => {
    window.addEventListener("click", handleClickAway);
    return () => {
      window.removeEventListener("click", handleClickAway);
    };
  }, [handleClickAway]);

  function getPosition() {
    if (!position || position === "left") {
      return "left-0 origin-top-left";
    }
    return "right-0 origin-top-right";
  }

  function getVisibility() {
    return open
      ? "transform opacity-100 scale-100 transition ease-out duration-100"
      : "transform opacity-0 scale-95 hidden transition ease-in duration-75";
  }

  return (
    <div
      ref={ref}
      className={`absolute ${getPosition()} ${getVisibility()} z-10 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="menu-button"
      tabIndex={-1}
    >
      <div className="py-1" role="none">
        {children}
      </div>
    </div>
  );
}
