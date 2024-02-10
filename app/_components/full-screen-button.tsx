import { FullScreenHandle } from "react-full-screen";

import Maximize from "@/_icons/maximize";
import Minimize from "@/_icons/minimize";

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
      {handle.active ? <Minimize /> : <Maximize />}
    </button>
  );
}
