import {
  GuideStep,
  defaultPlacement,
  initialGuideStep,
  movePlacement,
  nextGuideStep,
  placementFromPoints,
  pointsFromPlacement,
  previousGuideStep,
  rotatePlacement,
  scalePlacement,
  targetBoxSize,
} from "@/_lib/guided-calibration";
import { Unit } from "@/_lib/unit";

function expectPointsClose(
  actual: { x: number; y: number }[],
  expected: { x: number; y: number }[],
) {
  expect(actual.length).toBe(expected.length);
  actual.forEach((p, i) => {
    expect(p.x).toBeCloseTo(expected[i].x, 6);
    expect(p.y).toBeCloseTo(expected[i].y, 6);
  });
}

describe("pointsFromPlacement", () => {
  test("places an unrotated grid around its centre, clockwise from the top left", () => {
    const points = pointsFromPlacement(
      { center: { x: 500, y: 400 }, scale: 10, rotation: 0 },
      24,
      16,
    );
    expectPointsClose(points, [
      { x: 380, y: 320 },
      { x: 620, y: 320 },
      { x: 620, y: 480 },
      { x: 380, y: 480 },
    ]);
  });

  test("turns the grid clockwise on screen for a positive rotation", () => {
    const points = pointsFromPlacement(
      { center: { x: 0, y: 0 }, scale: 1, rotation: Math.PI / 2 },
      2,
      2,
    );
    // The top left corner ends up at the top right
    expect(points[0].x).toBeCloseTo(1);
    expect(points[0].y).toBeCloseTo(-1);
  });
});

describe("placementFromPoints", () => {
  test("recovers the placement that produced a set of points", () => {
    const placement = {
      center: { x: 640, y: 360 },
      scale: 23.5,
      rotation: 0.1,
    };
    const recovered = placementFromPoints(
      pointsFromPlacement(placement, 24, 16),
      24,
      16,
    );
    expect(recovered.center.x).toBeCloseTo(640);
    expect(recovered.center.y).toBeCloseTo(360);
    expect(recovered.scale).toBeCloseTo(23.5);
    expect(recovered.rotation).toBeCloseTo(0.1);
  });

  test("squares up a slightly skewed calibration", () => {
    const skewed = [
      { x: 100, y: 100 },
      { x: 340, y: 104 },
      { x: 338, y: 262 },
      { x: 98, y: 258 },
    ];
    const placement = placementFromPoints(skewed, 24, 16);
    expect(placement.scale).toBeCloseTo(10, 0);
    expect(Math.abs(placement.rotation)).toBeLessThan(0.02);
  });
});

describe("changing the placement", () => {
  const placement = { center: { x: 10, y: 20 }, scale: 5, rotation: 0 };

  test("moves the centre", () => {
    expect(movePlacement(placement, { x: 3, y: -4 }).center).toEqual({
      x: 13,
      y: 16,
    });
  });

  test("resizes around the centre", () => {
    const bigger = scalePlacement(placement, 2);
    expect(bigger.scale).toBe(10);
    expect(bigger.center).toEqual(placement.center);
  });

  test("never shrinks the grid to nothing", () => {
    expect(scalePlacement(placement, 0).scale).toBeGreaterThan(0);
  });

  test("rotates", () => {
    expect(rotatePlacement(placement, 0.25).rotation).toBe(0.25);
  });
});

test("default placement fits the grid inside the screen", () => {
  const placement = defaultPlacement(1280, 720, 24, 16);
  for (const p of pointsFromPlacement(placement, 24, 16)) {
    expect(p.x).toBeGreaterThan(0);
    expect(p.x).toBeLessThan(1280);
    expect(p.y).toBeGreaterThan(0);
    expect(p.y).toBeLessThan(720);
  }
});

test("target box is 8 x 6 inches in either unit", () => {
  expect(targetBoxSize(Unit.IN)).toEqual({ width: 8, height: 6 });
  const cm = targetBoxSize(Unit.CM);
  expect(cm.width).toBeCloseTo(20.32);
  expect(cm.height).toBeCloseTo(15.24);
});

describe("guide steps", () => {
  test("starts new users at the beginning and leaves calibrated users alone", () => {
    expect(initialGuideStep(false)).toBe(GuideStep.Print);
    expect(initialGuideStep(true)).toBeNull();
  });

  test("goes forwards and backwards in order, with the lens last", () => {
    expect(nextGuideStep(GuideStep.Print)).toBe(GuideStep.Align);
    expect(nextGuideStep(GuideStep.Align)).toBe(GuideStep.Corners);
    expect(nextGuideStep(GuideStep.Corners)).toBe(GuideStep.Lens);
    expect(nextGuideStep(GuideStep.Lens)).toBeNull();
    expect(previousGuideStep(GuideStep.Lens)).toBe(GuideStep.Corners);
    expect(previousGuideStep(GuideStep.Print)).toBe(GuideStep.Print);
  });
});
