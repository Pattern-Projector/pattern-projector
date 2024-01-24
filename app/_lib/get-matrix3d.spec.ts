import getMatrix3d from "@/_lib/get-matrix3d";

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
    2.86405074, 1.89358727e-1, -2.04720453e2, 0, 7.10878995e-2, 2.79612405,
    -1.6296901e3, 0, 1.60734029e-4, 1.73337133e-4, 1.0, 0, 0, 0, 0, 1,
  ];

  const matrix = getMatrix3d(src, dst);

  for (let i = 0; i < matrix.length; i++) {
    expect(matrix[i]).toBeCloseTo(openCVMatrix[i]);
  }
});
