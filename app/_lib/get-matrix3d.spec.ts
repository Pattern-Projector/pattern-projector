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
    2.864050742318774, 0.07108789949297858, 0, 0.00016073402857508592,
    0.1893587267624101, 2.7961240467325417, 0, 0.00017333713252165822, 0, 0, 1,
    0, -204.72045347183263, -1629.6900958816486, 0, 1,
  ];

  const matrix = getMatrix3d(src, dst);

  for (let i = 0; i < matrix.length; i++) {
    expect(matrix[i]).toBeCloseTo(openCVMatrix[i]);
  }
});
