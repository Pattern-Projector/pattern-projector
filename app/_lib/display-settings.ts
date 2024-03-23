import { OverlayMode } from "@/_lib/drawing";

export interface DisplaySettings {
  inverted: boolean;
  isInvertedGreen: boolean;
  isFourCorners: boolean;
  overlayMode: OverlayMode;
}

export function getDefaultDisplaySettings() {
  return {
    inverted: false,
    isInvertedGreen: false,
    isFourCorners: true,
    overlayMode: OverlayMode.BORDER
  };
}