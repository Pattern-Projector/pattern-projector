export interface OverlaySettings {
  disabled: boolean;
  grid: boolean;
  border: boolean;
  paper: boolean;
  flipLines: boolean;
  flippedPattern: boolean;
}

export function getDefaultOverlaySettings() {
  return {
    disabled: false,
    grid: false,
    border: false,
    paper: false,
    flipLines: false,
    flippedPattern: true,
  };
}

export enum Theme {
  Light = "Light",
  Dark = "Dark",
  Green = "Green",
}
export interface DisplaySettings {
  theme: Theme;
  overlay: OverlaySettings;
}

export function getDefaultDisplaySettings() {
  return {
    theme: Theme.Light,
    overlay: getDefaultOverlaySettings(),
  };
}

export function themes() {
  return [Theme.Light, Theme.Green, Theme.Dark];
}

export function isDarkTheme(theme: Theme) {
  return [Theme.Dark, Theme.Green].includes(theme);
}

export function themeFilter(theme: Theme): string {
  switch (theme) {
    case Theme.Dark:
      return "invert(1)";
    case Theme.Green:
      return "invert(1) sepia(1) saturate(10000%) hue-rotate(65deg) brightness(1.5)";
    case Theme.Light:
      return "none";
  }
}

export function strokeColor(theme: Theme) {
  switch (theme) {
    case Theme.Dark:
      return "#fff";
    case Theme.Green:
      return "#32CD32";
    case Theme.Light:
      return "#000";
  }
}

export function fillColor(theme: Theme) {
  return isDarkTheme(theme) ? "#000" : "#fff";
}
