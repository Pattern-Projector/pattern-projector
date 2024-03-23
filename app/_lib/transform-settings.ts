import Matrix from "ml-matrix";

export interface TransformSettings {
  matrix: Matrix;
}

export function getDefaultTransforms() {
  return {
    matrix: Matrix.identity(3, 3),
  };
}
