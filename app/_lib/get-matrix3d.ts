import { AbstractMatrix } from "ml-matrix";

import getPerspectiveTransform from "./get-perspective-transform";
import Point from "./point";

/**
 * Converts 3x3 matrix returned from getPerspectiveTransform(src, dst) to a 4x4 matrix as per https://stackoverflow.com/a/4833408/3376039
 * @param src - Coordinates of quadrangle vertices in the source image starting from top left clockwise.
 * @param dst - Coordinates of the corresponding quadrangle vertices in the destination image starting from top left clockwise.
 * @returns A 4x4 matrix of a perspective transform flattened into a array of length 16.
 */
export default function getMatrix3d(src: Point[], dst: Point[]): number[] {
  var m = AbstractMatrix.from1DArray(3, 3, getPerspectiveTransform(src, dst));

  // Make the 3x3 into 4x4 by inserting a z component in the 3rd column.
  m.addColumn(2, AbstractMatrix.zeros(1, 3));
  m.addRow(2, AbstractMatrix.from1DArray(1, 4, [0, 0, 1, 0]));

  // Transpose since CSS.matrix3d is column major.
  m = m.transpose();
  console.log(m);
  return m.to1DArray();
}
