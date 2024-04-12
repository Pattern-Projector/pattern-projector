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
  const top = (window.screenTop === undefined) ? window.screenY : window.screenTop;
  const left = (window.screenLeft === undefined) ? window.screenX : window.screenLeft;
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

export function getCalibrationContextUpdatedWithPointerEvent(e: React.PointerEvent): CalibrationContext {
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
  const current = getCalibrationContextUpdatedWithPointerEvent(e);
  return (
    getIsInvalidatedCalibrationContext(context) || 
    context.clientScreenTop !== current.clientScreenTop ||
    context.clientScreenLeft !== current.clientScreenLeft
  );
}

export function logDifferences(
  context: CalibrationContext,
  current: CalibrationContext,
): void {
  if (context.windowInnerWidth !== current.windowInnerWidth) {
    console.log("windowInnerWidthDidChange", context.windowInnerWidth, current.windowInnerWidth);
  }
  if (context.windowInnerHeight !== current.windowInnerHeight) {
    console.log("windowInnerHeightDidChange", context.windowInnerHeight, current.windowInnerHeight);
  }
  if (context.windowScreenTop !== current.windowScreenTop) {
    console.log("windowScreenTopDidChange", context.windowScreenTop, current.windowScreenTop);
  }
  if (context.windowScreenLeft !== current.windowScreenLeft) {
    console.log("windowScreenLeftDidChange", context.windowScreenLeft, current.windowScreenLeft);
  }
  if (context.devicePixelRatio !== current.devicePixelRatio) {
    console.log("devicePixelRatioDidChange", context.devicePixelRatio, current.devicePixelRatio);
  }
  if (context.clientScreenTop !== current.clientScreenTop) {
    console.log("clientScreenTopDidChange", context.clientScreenTop, current.clientScreenTop);
  }
  if (context.clientScreenLeft !== current.clientScreenLeft) {
    console.log("clientScreenLeftDidChange", context.clientScreenLeft, current.clientScreenLeft);
  }
}
