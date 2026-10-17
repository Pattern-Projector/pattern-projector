import CalibrationContext from "@/_lib/calibration-context";

/** Where opening a project from the home screen leads. */
export enum OpenDestination {
  Calibrate = "calibrate",
  Project = "project",
}

/**
 * Opening a project goes straight to projecting when there is a calibration made in full screen. Otherwise it goes to
 * calibration, which happens in full screen so the measurements match while cutting. Browsers without full screen
 * (such as iPhone Safari) can only calibrate in the window, so a calibration made there counts.
 */
export function openDestination(
  savedPoints: string | null,
  savedContext: CalibrationContext | null,
  fullScreenAvailable: boolean,
): OpenDestination {
  if (savedPoints === null || savedContext === null) {
    return OpenDestination.Calibrate;
  }
  if (fullScreenAvailable && !savedContext.fullScreen) {
    return OpenDestination.Calibrate;
  }
  return OpenDestination.Project;
}

/** Reads the calibration context saved in localStorage, ignoring anything unreadable. */
export function parseCalibrationContext(
  value: string | null,
): CalibrationContext | null {
  try {
    const context = JSON.parse(value ?? "null");
    return context !== null && typeof context === "object" ? context : null;
  } catch {
    return null;
  }
}
