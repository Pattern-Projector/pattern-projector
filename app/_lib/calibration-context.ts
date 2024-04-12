export default interface CalibrationContext {
  windowInnerWidth: number;
  windowInnerHeight: number;
  windowScreenTop: number;
  windowScreenLeft: number;
  devicePixelRatio: number;
  clientScreenTop: number | null;
  clientScreenLeft: number | null;
}

export function getCalibrationContext(): CalibrationContext {
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
  };
}

export function getCalibrationContextUpdatedWithEvent(
  e: React.PointerEvent | React.MouseEvent,
): CalibrationContext {
  return {
    ...getCalibrationContext(),
    clientScreenTop: e.screenY - e.clientY,
    clientScreenLeft: e.screenX - e.clientX,
  };
}

export function getIsInvalidatedCalibrationContext(
  context: CalibrationContext,
): boolean {
  const current = getCalibrationContext();
  return (
    context.windowInnerWidth !== current.windowInnerWidth ||
    context.windowInnerHeight !== current.windowInnerHeight ||
    context.windowScreenTop !== current.windowScreenTop ||
    context.windowScreenLeft !== current.windowScreenLeft ||
    context.devicePixelRatio !== current.devicePixelRatio
  );
}

export function getIsInvalidatedCalibrationContextWithPointerEvent(
  context: CalibrationContext,
  e: React.PointerEvent,
): boolean {
  const current = getCalibrationContextUpdatedWithEvent(e);
  return (
    getIsInvalidatedCalibrationContext(context) ||
    context.clientScreenTop !== current.clientScreenTop ||
    context.clientScreenLeft !== current.clientScreenLeft
  );
}
