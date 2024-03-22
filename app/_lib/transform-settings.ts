import { Point } from "@/_lib/point";
import Matrix from "ml-matrix";

export interface TransformSettings {
  matrix: Matrix;
  inverted: boolean;
  isInvertedGreen: boolean;
  isFourCorners: boolean;
}

export function getDefaultTransforms() {
  return {
    inverted: false,
    isInvertedGreen: false,
    isFourCorners: true,
    matrix: Matrix.identity(3, 3),
  };
}
