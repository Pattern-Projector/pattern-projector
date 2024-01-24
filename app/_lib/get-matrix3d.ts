import getPerspectiveTransform from "./get-perspective-transform";
import Point from "./point";

/**
 * Converts 3x3 matrix returned from getPerspectiveTransform(src, dst) to a 4x4 matrix as per https://stackoverflow.com/a/4833408/3376039
 * @param src - Coordinates of quadrangle vertices in the source image starting from top left clockwise.
 * @param dst - Coordinates of the corresponding quadrangle vertices in the destination image starting from top left clockwise.
 * @returns A 4x4 matrix of a perspective transform flattened into a array of length 16.
 */
export default function getMatrix3d(src: Point[], dst: Point[]): number[] {
  const perspectiveTransform = getPerspectiveTransform(src, dst);
  const matrix3d = Array<number>(16);

  for (let i = 0, j = 0; i < matrix3d.length; i++) {
    switch (i) {
      case 3:
      case 7:
      case 11:
      case 12:
      case 13:
      case 14:
        matrix3d[i] = 0;
        break;
      case 15:
        matrix3d[i] = 1;
        break;
      default:
        matrix3d[i] = perspectiveTransform[j++];
    }
  }

  return matrix3d;
}
