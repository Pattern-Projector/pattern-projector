import { EdgeInsets } from "./edge-insets";

export enum LineDirection {
  Row = "Row",
  Column = "Column",
}

export enum VerticalAlignment {
  Top = "Top",
  Bottom = "Bottom",
}

export interface StitchSettings {
  key: string;
  lineCount: number;
  edgeInsets: EdgeInsets;
  pageRange: string;
  lineDirection: LineDirection;
  verticalAlignment: VerticalAlignment;
}
