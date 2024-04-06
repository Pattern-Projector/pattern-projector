import { getPerspectiveTransform, toMatrix3d } from "@/_lib/geometry";

// opencv-python input and output
// >>> import cv2
// >>> import numpy as np
// >>> input_pts = np.float32([[33, 582], [151, 579], [145, 702], [25, 703]])
// >>> output_pts = np.float32([[0, 0], [300, 0], [300, 300], [0, 300]])
// >>> M = cv2.getPerspectiveTransform(input_pts,output_pts)
// >>> print(M)
// [[ 2.86405074e+00  1.89358727e-01 -2.04720453e+02]
//  [ 7.10878995e-02  2.79612405e+00 -1.62969010e+03]
//  [ 1.60734029e-04  1.73337133e-04  1.00000000e+00]]

test("gets perspective transform with the same inputs and outputs as opencv-python", () => {
  const src = [
    { x: 33, y: 582 },
    { x: 151, y: 579 },
    { x: 145, y: 702 },
    { x: 25, y: 703 },
  ];
  const dst = [
    { x: 0, y: 0 },
    { x: 300, y: 0 },
    { x: 300, y: 300 },
    { x: 0, y: 300 },
  ];
  const openCVMatrix = [
    2.86405074, 1.89358727e-1, -2.04720453e2, 7.10878995e-2, 2.79612405,
    -1.6296901e3, 1.60734029e-4, 1.73337133e-4, 1.0,
  ];

  const matrix = getPerspectiveTransform(src, dst);

  for (let i = 0; i < matrix.length; i++) {
    expect(matrix[i]).toBeCloseTo(openCVMatrix[i]);
  }
});

test("coverts 3x3 matrix to 4x4 matrix", () => {
  const src = [
    { x: 33, y: 582 },
    { x: 151, y: 579 },
    { x: 145, y: 702 },
    { x: 25, y: 703 },
  ];
  const dst = [
    { x: 0, y: 0 },
    { x: 300, y: 0 },
    { x: 300, y: 300 },
    { x: 0, y: 300 },
  ];
  const openCVMatrix = [
    2.864050742318774, 0.07108789949297858, 0, 0.00016073402857508592,
    0.1893587267624101, 2.7961240467325417, 0, 0.00017333713252165822, 0, 0, 1,
    0, -204.72045347183263, -1629.6900958816486, 0, 1,
  ];

  const matrix = toMatrix3d(src, dst);

  for (let i = 0; i < matrix.length; i++) {
    expect(matrix[i]).toBeCloseTo(openCVMatrix[i]);
  }
});
