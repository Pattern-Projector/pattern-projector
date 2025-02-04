import { EdgeInsets } from "./edge-insets";

export enum LineDirection {
  Row = "Row",
  Column = "Column",
}

export interface StitchSettings {
  key: string;
  lineCount: number;
  edgeInsets: EdgeInsets;
  pageRange: string;
  lineDirection: LineDirection;
}
