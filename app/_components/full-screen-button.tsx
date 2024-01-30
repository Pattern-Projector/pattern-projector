import { FullScreenHandle } from "react-full-screen";

import Maximize from "@/_icons/maximize";
import Minimize from "@/_icons/minimize";

export default function FullScreenButton({
  handle,
}: {
  handle: FullScreenHandle;
}) {
  return (
    <button
      className="ml-auto"
      data-test-id="fullScreenButton"
      name={handle.active ? "Exit full screen" : "Enter full screen"}
      onClick={handle.active ? handle.exit : handle.enter}
    >
      {handle.active ? <Minimize /> : <Maximize />}
    </button>
  );
}
