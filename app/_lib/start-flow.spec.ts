import CalibrationContext from "@/_lib/calibration-context";
import {
  OpenDestination,
  openDestination,
  parseCalibrationContext,
} from "@/_lib/start-flow";

const points = "[]";
function context(fullScreen: boolean): CalibrationContext {
  return {
    windowInnerWidth: 1280,
    windowInnerHeight: 720,
    windowScreenTop: 0,
    windowScreenLeft: 0,
    devicePixelRatio: 1,
    clientScreenTop: 0,
    clientScreenLeft: 0,
    fullScreen,
  };
}

test("goes straight to projecting with a full screen calibration", () => {
  expect(openDestination(points, context(true), true)).toBe(
    OpenDestination.Project,
  );
});

test("calibrates first when there is no calibration yet", () => {
  expect(openDestination(null, null, true)).toBe(OpenDestination.Calibrate);
  expect(openDestination(points, null, true)).toBe(OpenDestination.Calibrate);
});

test("calibrates again in full screen when the calibration was made in a window", () => {
  expect(openDestination(points, context(false), true)).toBe(
    OpenDestination.Calibrate,
  );
});

test("accepts a window calibration where full screen isn't available", () => {
  expect(openDestination(points, context(false), false)).toBe(
    OpenDestination.Project,
  );
});

test("ignores an unreadable calibration context", () => {
  expect(parseCalibrationContext(null)).toBeNull();
  expect(parseCalibrationContext("{")).toBeNull();
  expect(parseCalibrationContext("3")).toBeNull();
  expect(parseCalibrationContext(JSON.stringify(context(true)))).toEqual(
    context(true),
  );
});
