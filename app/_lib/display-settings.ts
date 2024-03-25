import { OverlayMode } from "@/_lib/drawing";

export interface OverlaySettings {
  disabled: boolean;
  grid: boolean;
  border: boolean;
  paper: boolean;
  fliplines: boolean;
}

export function getDefaultOverlaySettings() {
  return {
    disabled: false,
    grid: false,
    border: true,
    paper: false,
    fliplines: false,
  };
}

export interface DisplaySettings {
  inverted: boolean;
  isInvertedGreen: boolean;
  isFourCorners: boolean;
  overlay: OverlaySettings;
}

export function getDefaultDisplaySettings() {
  return {
    inverted: false,
    isInvertedGreen: false,
    isFourCorners: true,
    overlay: getDefaultOverlaySettings(),
  };
}
