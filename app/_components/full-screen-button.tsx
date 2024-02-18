import { FullScreenHandle } from "react-full-screen";

import FullscreenExitIcon from "@/_icons/fullscreen-exit-icon";
import FullscreenIcon from "@/_icons/fullscreen-icon";

/**
 *
 * @param className - Class names to apply to button
 * @param handle - Full screen handler
 */
export default function FullScreenButton({
  className,
  handle,
}: {
  className?: string | undefined;
  handle: FullScreenHandle;
}) {
  return (
    <button
      className={className}
      data-test-id="fullScreenButton"
      name={handle.active ? "Exit full screen" : "Enter full screen"}
      onClick={handle.active ? handle.exit : handle.enter}
    >
      {handle.active ? <FullscreenExitIcon /> : <FullscreenIcon />}
    </button>
  );
}
