import CalibrationContext, {
  getCalibrationMismatch,
} from "@/_lib/calibration-context";

function context(overrides: Partial<CalibrationContext>): CalibrationContext {
  return {
    windowInnerWidth: 1440,
    windowInnerHeight: 900,
    windowScreenTop: 25,
    windowScreenLeft: 0,
    devicePixelRatio: 2,
    clientScreenTop: null,
    clientScreenLeft: null,
    fullScreen: true,
    ...overrides,
  };
}

test("matches when nothing changed", () => {
  expect(getCalibrationMismatch(context({}), context({}))).toBeNull();
});

test("says when there is no calibration", () => {
  expect(getCalibrationMismatch(null, context({}))).toEqual({
    kind: "uncalibrated",
  });
});

test("says which way full screen and window don't match", () => {
  expect(
    getCalibrationMismatch(context({}), context({ fullScreen: false })),
  ).toEqual({ kind: "calibratedInFullScreen" });
  expect(
    getCalibrationMismatch(context({ fullScreen: false }), context({})),
  ).toEqual({ kind: "calibratedInWindow" });
});

test("reports a size change with the sizes", () => {
  expect(
    getCalibrationMismatch(
      context({}),
      context({ windowInnerWidth: 1920, windowInnerHeight: 1080 }),
    ),
  ).toEqual({
    kind: "sizeChanged",
    was: { width: 1440, height: 900 },
    now: { width: 1920, height: 1080 },
  });
});

test("ignores where the window was when in full screen", () => {
  expect(
    getCalibrationMismatch(
      context({}),
      context({ windowScreenTop: 300, windowScreenLeft: 200 }),
    ),
  ).toBeNull();
});

test("notices a moved window when not in full screen", () => {
  expect(
    getCalibrationMismatch(
      context({ fullScreen: false }),
      context({ fullScreen: false, windowScreenLeft: 200 }),
    ),
  ).toEqual({ kind: "windowMoved" });
});
