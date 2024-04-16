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
  return (
    context.clientScreenTop !== current.clientScreenTop ||
    context.clientScreenLeft !== current.clientScreenLeft
  );
}
