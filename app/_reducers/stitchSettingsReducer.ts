import { EdgeInsets } from "@/_lib/interfaces/edge-insets";
import { StitchSettings } from "@/_lib/interfaces/stitch-settings";

export type StitchSettingsAction =
  | { type: "set"; stitchSettings: StitchSettings }
  | { type: "set-page-range"; pageRange: string }
  | { type: "set-line-count"; lineCount: number; pageCount: number }
  | { type: "step-line-count"; pageCount: number; step: number }
  | { type: "step-horizontal"; step: number }
  | { type: "step-vertical"; step: number }
  | { type: "set-edge-insets"; edgeInsets: EdgeInsets };

export default function stitchSettingsReducer(
  stitchSettings: StitchSettings,
  action: StitchSettingsAction,
): StitchSettings {
  const newStitchSettings = reduceStitchSettings(stitchSettings, action);
  localStorage.setItem(
    newStitchSettings.key,
    JSON.stringify(newStitchSettings),
  );
  return newStitchSettings;
}

function reduceStitchSettings(
  stitchSettings: StitchSettings,
  action: StitchSettingsAction,
): StitchSettings {
  switch (action.type) {
    case "set":
      return action.stitchSettings;
    case "set-page-range":
      return { ...stitchSettings, pageRange: action.pageRange };
    case "set-line-count": {
      const lineCount =
        action.pageCount >= action.lineCount && action.lineCount >= 0
          ? action.lineCount
          : stitchSettings.lineCount;
      return { ...stitchSettings, lineCount };
    }
    case "step-line-count": {
      const count = stitchSettings.lineCount + action.step;
      const lineCount =
        count <= action.pageCount && count >= 0
          ? count
          : stitchSettings.lineCount;
      return { ...stitchSettings, lineCount };
    }
    case "step-horizontal": {
      const horizontal = Math.max(
        0,
        stitchSettings.edgeInsets.horizontal + action.step,
      );
      return {
        ...stitchSettings,
        edgeInsets: { ...stitchSettings.edgeInsets, horizontal },
      };
    }
    case "step-vertical": {
      const vertical = Math.max(
        0,
        stitchSettings.edgeInsets.vertical + action.step,
      );
      return {
        ...stitchSettings,
        edgeInsets: { ...stitchSettings.edgeInsets, vertical },
      };
    }
    case "set-edge-insets": {
      return { ...stitchSettings, edgeInsets: action.edgeInsets };
    }
  }
}
