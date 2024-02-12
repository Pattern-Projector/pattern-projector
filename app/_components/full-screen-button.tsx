import { FullScreenHandle } from "react-full-screen";

import MinimizeIcon from "@/_icons/minimize-icon";
import MaximizeIcon from "@/_icons/maximize-icon";

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
      {handle.active ? <MinimizeIcon /> : <MaximizeIcon />}
    </button>
  );
}
