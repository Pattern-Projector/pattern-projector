import { Matrix } from "ml-matrix";
import { CanvasState, drawOverlays } from "@/_lib/drawing";
import { getDefaultDisplaySettings } from "@/_lib/display-settings";
import { rectCorners } from "@/_lib/geometry";
import { Unit } from "@/_lib/unit";

const identity = Matrix.identity(3);
const originalWidth = Object.getOwnPropertyDescriptor(window, "innerWidth")!;
const originalHeight = Object.getOwnPropertyDescriptor(window, "innerHeight")!;
afterEach(() => {
  Object.defineProperty(window, "innerWidth", originalWidth);
  Object.defineProperty(window, "innerHeight", originalHeight);
});

function outline(calibration: Matrix, local: Matrix, overview: Matrix) {
  const points: number[][] = [];
  const ctx = {
    save: jest.fn(),
    restore: jest.fn(),
    measureText: () => ({ width: 0 }),
    fillText: jest.fn(),
    beginPath: jest.fn(),
    moveTo: (x: number, y: number) => points.push([x, y]),
    lineTo: (x: number, y: number) => points.push([x, y]),
    closePath: jest.fn(),
    stroke: jest.fn(),
  } as unknown as CanvasRenderingContext2D;
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 1000,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 800,
  });
  drawOverlays(
    new CanvasState(
      ctx,
      { x: 0, y: 0 },
      rectCorners(1000, 800),
      1000,
      800,
      identity,
      false,
      new Set(),
      new Set(),
      Unit.IN,
      "black",
      getDefaultDisplaySettings(),
      false,
      overview,
      true,
      false,
      { calibrationTransform: calibration, localTransform: local },
      () => "Zoomed out",
      "1",
    ),
  );
  return points;
}

test.each([
  {
    name: "identity and translated overview",
    calibration: identity,
    local: identity,
    overview: new Matrix([
      [0.5, 0, 20],
      [0, 0.5, 30],
      [0, 0, 1],
    ]),
    expected: [
      [20, 30],
      [520, 30],
      [520, 430],
      [20, 430],
    ],
  },
  {
    name: "signed pattern translation",
    calibration: identity,
    local: new Matrix([
      [1, 0, 100],
      [0, 1, -50],
      [0, 0, 1],
    ]),
    overview: new Matrix([
      [0.5, 0, 0],
      [0, 0.5, 0],
      [0, 0, 1],
    ]),
    expected: [
      [-50, 25],
      [450, 25],
      [450, 425],
      [-50, 425],
    ],
  },
  {
    name: "rotated pattern",
    calibration: identity,
    local: new Matrix([
      [0, -1, 300],
      [1, 0, 40],
      [0, 0, 1],
    ]),
    overview: new Matrix([
      [0, -0.5, 170],
      [0.5, 0, 20],
      [0, 0, 1],
    ]),
    expected: [
      [20, 0],
      [520, 0],
      [520, 400],
      [20, 400],
    ],
  },
  {
    name: "flipped pattern and nonuniform calibration",
    calibration: new Matrix([
      [2, 0, 30],
      [0, 3, 60],
      [0, 0, 1],
    ]),
    local: new Matrix([
      [-1, 0, 400],
      [0, 1, -20],
      [0, 0, 1],
    ]),
    overview: new Matrix([
      [-0.25, 0, 100],
      [0, 0.25, 5],
      [0, 0, 1],
    ]),
    expected: [
      [-3.75, 5],
      [121.25, 5],
      [121.25, 800 / 12 + 5],
      [-3.75, 800 / 12 + 5],
    ],
  },
  {
    name: "projective calibration",
    calibration: new Matrix([
      [1, 0, 0],
      [0, 1, 0],
      [0.0002, 0.0001, 1],
    ]),
    local: identity,
    overview: new Matrix([
      [0.5, 0, 0],
      [0, 0.5, 0],
      [0, 0, 1],
    ]),
    // Inverse calibration divides screen x/y by 1 - 0.0002*x - 0.0001*y.
    expected: [
      [0, 0],
      [625, 0],
      [500 / 0.72, 400 / 0.72],
      [0, 400 / 0.92],
    ],
  },
])(
  "overview outlines the original viewport for $name",
  ({ calibration, local, overview, expected }) => {
    const actual = outline(calibration, local, overview);
    expect(actual).toHaveLength(4);
    actual.forEach((point, i) =>
      point.forEach((coordinate, j) => {
        expect(coordinate).toBeCloseTo(expected[i][j], 8);
      }),
    );
  },
);
