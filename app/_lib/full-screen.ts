import { FullScreenHandle } from "react-full-screen";

// Type error in react-full-screen so need to wrap in a try-catch
export function toggleFullScreen(fullScreenHandle: FullScreenHandle): void {
  try {
    fullScreenHandle.active ? fullScreenHandle.exit : fullScreenHandle.enter;
  } catch (error) {
    console.error("Error toggling full screen", error);
  }
}
