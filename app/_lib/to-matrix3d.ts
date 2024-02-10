import Matrix, { AbstractMatrix } from "ml-matrix";

/**
 * Converts 3x3 matrix returned from getPerspectiveTransform(src, dst) to a 4x4 matrix as per https://stackoverflow.com/a/4833408/3376039
 * @param src - Coordinates of quadrangle vertices in the source image starting from top left clockwise.
 * @param dst - Coordinates of the corresponding quadrangle vertices in the destination image starting from top left clockwise.
 * @returns A css transfomr string
 */
export default function toMatrix3d(m: Matrix): string {
  var r = m.clone();
  console.log(r);
  // Make the 3x3 into 4x4 by inserting a z component in the 3rd column.
  r.addColumn(2, AbstractMatrix.zeros(1, 3));
  r.addRow(2, AbstractMatrix.from1DArray(1, 4, [0, 0, 1, 0]));

  // Transpose since CSS.matrix3d is column major.
  r = r.transpose();
  return `matrix3d(${r.to1DArray().toString()})`;
}
