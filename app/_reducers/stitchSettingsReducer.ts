import { EdgeInsets } from "@/_lib/interfaces/edge-insets";
import { StitchSettings } from "@/_lib/interfaces/stitch-settings";

interface SetPageRangeAction {
  type: "set-page-range";
  pageRange: string;
}

interface SetColumnCountAction {
  type: "set-column-count";
  columnCount: number;
  pageCount: number;
}

interface StepColumnCountAction {
  type: "step-column-count";
  pageCount: number;
  step: number;
}

interface StepHorizontalAction {
  type: "step-horizontal";
  step: number;
}

interface StepVerticalAction {
  type: "step-vertical";
  step: number;
}

interface SetEdgeInsetsAction {
  type: "set-edge-insets";
  edgeInsets: EdgeInsets;
}

export type StitchSettingsAction =
  | SetPageRangeAction
  | StepColumnCountAction
  | SetColumnCountAction
  | StepHorizontalAction
  | StepVerticalAction
  | SetEdgeInsetsAction;

export default function stitchSettingsReducer(
  stitchSettings: StitchSettings,
  action: StitchSettingsAction,
) {
  switch (action.type) {
    case "set-page-range":
      return { ...stitchSettings, pageRange: action.pageRange };
    case "set-column-count": {
      const columnCount =
        action.pageCount >= action.columnCount && action.columnCount >= 0
          ? action.columnCount
          : stitchSettings.columnCount;
      return { ...stitchSettings, columnCount };
    }
    case "step-column-count": {
      const count = stitchSettings.columnCount + action.step;
      const columnCount =
        count <= action.pageCount && count >= 0
          ? count
          : stitchSettings.columnCount;
      return { ...stitchSettings, columnCount };
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
