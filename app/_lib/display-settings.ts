import { OverlayMode } from "@/_lib/drawing";

export interface OverlaySettings {
  disabled: boolean;
  grid: boolean;
  border: boolean;
  paper: boolean;
  fliplines: boolean;
  opacity: number;
}

export function getDefaultOverlaySettings() {
  return {
    disabled: false,
    grid: false,
    border: true,
    paper: false,
    fliplines: false,
    opacity: 100,
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
