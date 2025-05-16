export default interface CalibrationContext {
  windowInnerWidth: number;
  windowInnerHeight: number;
  windowScreenTop: number;
  windowScreenLeft: number;
  devicePixelRatio: number;
  clientScreenTop: number | null;
  clientScreenLeft: number | null;
  fullScreen: boolean;
}

export function logCalibrationContextDifferences(
  context: CalibrationContext,
  fullScreen: boolean,
): void {
  const current = getCalibrationContext(fullScreen);
  console.log("CalibrationContext differences:");
  if (context.windowInnerWidth !== current.windowInnerWidth) {
    console.log(
      "windowInnerWidth:",
      context.windowInnerWidth,
      current.windowInnerWidth,
    );
  }
  if (context.windowInnerHeight !== current.windowInnerHeight) {
    console.log(
      "windowInnerHeight:",
      context.windowInnerHeight,
      current.windowInnerHeight,
    );
  }
  if (context.windowScreenTop !== current.windowScreenTop) {
    console.log(
      "windowScreenTop:",
      context.windowScreenTop,
      current.windowScreenTop,
    );
  }
  if (context.windowScreenLeft !== current.windowScreenLeft) {
    console.log(
      "windowScreenLeft:",
      context.windowScreenLeft,
      current.windowScreenLeft,
    );
  }
  if (context.devicePixelRatio !== current.devicePixelRatio) {
    console.log(
      "devicePixelRatio:",
      context.devicePixelRatio,
      current.devicePixelRatio,
    );
  }
  if (context.fullScreen !== current.fullScreen) {
    console.log("fullScreen:", context.fullScreen, current.fullScreen);
  }
}

export function getCalibrationContext(fullScreen: boolean): CalibrationContext {
  const top =
    window.screenTop === undefined ? window.screenY : window.screenTop;
  const left =
    window.screenLeft === undefined ? window.screenX : window.screenLeft;
  return {
    windowInnerWidth: window.innerWidth,
    windowInnerHeight: window.innerHeight,
    windowScreenTop: top,
    windowScreenLeft: left,
    devicePixelRatio: window.devicePixelRatio,
    clientScreenTop: null,
    clientScreenLeft: null,
    fullScreen,
  };
}

export function getCalibrationContextUpdatedWithEvent(
  e: React.PointerEvent | React.MouseEvent,
  fullScreen: boolean,
): CalibrationContext {
  return {
    ...getCalibrationContext(fullScreen),
    clientScreenTop: e.screenY - e.clientY,
    clientScreenLeft: e.screenX - e.clientX,
  };
}

export function getIsInvalidatedCalibrationContext(
  context: CalibrationContext,
  fullScreen: boolean,
): boolean {
  const current = getCalibrationContext(fullScreen);
  return (
    context.windowInnerWidth !== current.windowInnerWidth ||
    context.windowInnerHeight !== current.windowInnerHeight ||
    context.windowScreenTop !== current.windowScreenTop ||
    context.windowScreenLeft !== current.windowScreenLeft ||
    context.devicePixelRatio !== current.devicePixelRatio ||
    context.fullScreen !== current.fullScreen
  );
}

export function getIsInvalidatedCalibrationContextWithPointerEvent(
  context: CalibrationContext,
  e: React.PointerEvent,
  fullScreen: boolean,
  allowMissingClientScreen = false,
): boolean {
  const current = getCalibrationContextUpdatedWithEvent(e, fullScreen);
  if (getIsInvalidatedCalibrationContext(context, fullScreen)) {
    return true;
  }
  if (allowMissingClientScreen) {
    if (
      context.clientScreenTop === null ||
      context.clientScreenTop === undefined ||
      current.clientScreenLeft === null ||
      current.clientScreenLeft === undefined
    ) {
      return false;
    }
  }
  // check if the difference is greater than 3 since the values sometimes fluctuate without the viewport changing (Firefox on Desktop and Chrome on Android)
  // considered no difference if any values are null
  const topDiff =
    context.clientScreenTop === null || current.clientScreenTop === null
      ? false
      : Math.abs(context.clientScreenTop - current.clientScreenTop) > 3;
  const leftDiff =
    context.clientScreenLeft === null || current.clientScreenLeft === null
      ? false
      : Math.abs(context.clientScreenLeft - current.clientScreenLeft) > 3;
  if (context.clientScreenTop !== current.clientScreenTop) {
    console.log(
      "clientScreenTop:",
      context.clientScreenTop,
      current.clientScreenTop,
    );
  }
  if (context.clientScreenLeft !== current.clientScreenLeft) {
    console.log(
      "clientScreenLeft:",
      context.clientScreenLeft,
      current.clientScreenLeft,
    );
  }
  return (topDiff || leftDiff) && !context.fullScreen;
}
