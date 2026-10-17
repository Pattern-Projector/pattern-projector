import {
  clampLensCorrectionStrength,
  createDisplacementMap,
  decodeDisplacement,
  isLensCorrectionActive,
  keepPointsInPlace,
  lensDisplayPoint,
  lensSourcePoint,
  maxLensDisplacement,
  parseLensCorrection,
} from "@/_lib/lens-correction";

const width = 1920;
const height = 1080;

describe("lensSourcePoint", () => {
  test("leaves every point alone when the strength is zero", () => {
    const p = { x: 13, y: 977 };
    expect(lensSourcePoint(p, width, height, { strength: 0 })).toEqual(p);
  });

  test("never moves the centre of the screen", () => {
    const c = { x: width / 2, y: height / 2 };
    expect(lensSourcePoint(c, width, height, { strength: 10 })).toEqual(c);
  });

  test("moves the corners by the strength as a percentage of the half diagonal", () => {
    const q = lensSourcePoint({ x: 0, y: 0 }, width, height, { strength: 5 });
    expect(q.x).toBeCloseTo(-0.05 * (width / 2));
    expect(q.y).toBeCloseTo(-0.05 * (height / 2));
  });

  test("bends a straight edge: the middle of an edge moves less than its corners", () => {
    const lens = { strength: 5 };
    const corner = lensSourcePoint({ x: 0, y: 0 }, width, height, lens);
    const middle = lensSourcePoint(
      { x: 0, y: height / 2 },
      width,
      height,
      lens,
    );
    expect(Math.abs(middle.x)).toBeLessThan(Math.abs(corner.x));
    expect(middle.y).toBeCloseTo(height / 2);
  });

  test("negative strength moves points towards the centre", () => {
    const q = lensSourcePoint({ x: 0, y: 0 }, width, height, { strength: -5 });
    expect(q.x).toBeGreaterThan(0);
    expect(q.y).toBeGreaterThan(0);
  });

  test("handles an empty screen", () => {
    expect(lensSourcePoint({ x: 0, y: 0 }, 0, 0, { strength: 5 })).toEqual({
      x: 0,
      y: 0,
    });
  });
});

describe("createDisplacementMap", () => {
  const w = 160;
  const h = 90;
  const lens = { strength: 8 };
  const map = createDisplacementMap(w, h, lens);

  test("has one RGBA pixel per screen pixel", () => {
    expect(map.width).toBe(w);
    expect(map.height).toBe(h);
    expect(map.data.length).toBe(w * h * 4);
  });

  test("encodes the displacement at every pixel to within one quantisation step", () => {
    const step = map.scale / 255;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = { x: x + 0.5, y: y + 0.5 };
        const q = lensSourcePoint(p, w, h, lens);
        const d = decodeDisplacement(map, x, y);
        expect(Math.abs(d.x - (q.x - p.x))).toBeLessThanOrEqual(step);
        expect(Math.abs(d.y - (q.y - p.y))).toBeLessThanOrEqual(step);
      }
    }
  });

  test("keeps the largest displacement inside the channel range", () => {
    expect(map.scale).toBeGreaterThan(2 * maxLensDisplacement(w, h, lens));
    expect(map.data[0]).toBeGreaterThan(0);
    expect(map.data[0]).toBeLessThan(255);
  });

  test("is opaque so the browser does not premultiply the values away", () => {
    for (let i = 3; i < map.data.length; i += 4) {
      expect(map.data[i]).toBe(255);
    }
  });
});

describe("settings", () => {
  test("treats zero as off", () => {
    expect(isLensCorrectionActive({ strength: 0 })).toBe(false);
    expect(isLensCorrectionActive({ strength: 0.5 })).toBe(true);
  });

  test("clamps the strength to a sensible range", () => {
    expect(clampLensCorrectionStrength(100)).toBe(30);
    expect(clampLensCorrectionStrength(-100)).toBe(-30);
    expect(clampLensCorrectionStrength(NaN)).toBe(0);
  });

  test("parses saved settings and falls back to off for anything invalid", () => {
    expect(parseLensCorrection({ strength: 3 })).toEqual({ strength: 3 });
    expect(parseLensCorrection({ strength: "3" })).toEqual({ strength: 0 });
    expect(parseLensCorrection(null)).toEqual({ strength: 0 });
  });
});

describe("lensDisplayPoint", () => {
  test("undoes lensSourcePoint everywhere on screen", () => {
    for (const strength of [-10, -2.5, 0.25, 4, 15]) {
      const lens = { strength };
      for (const p of [
        { x: 0, y: 0 },
        { x: 1920, y: 1080 },
        { x: 100, y: 900 },
        { x: 960, y: 540 },
        { x: 1500, y: 20 },
      ]) {
        const back = lensDisplayPoint(
          lensSourcePoint(p, width, height, lens),
          width,
          height,
          lens,
        );
        expect(back.x).toBeCloseTo(p.x, 6);
        expect(back.y).toBeCloseTo(p.y, 6);
      }
    }
  });
});

describe("keepPointsInPlace", () => {
  const corners = [
    { x: 200, y: 120 },
    { x: 1700, y: 140 },
    { x: 1690, y: 980 },
    { x: 210, y: 960 },
  ];

  test("keeps every corner at the same place on screen when the lens changes", () => {
    const from = { strength: 1 };
    const to = { strength: 6.25 };
    const moved = keepPointsInPlace(corners, width, height, from, to);
    moved.forEach((p, i) => {
      const before = lensDisplayPoint(corners[i], width, height, from);
      const after = lensDisplayPoint(p, width, height, to);
      expect(after.x).toBeCloseTo(before.x, 6);
      expect(after.y).toBeCloseTo(before.y, 6);
    });
  });

  test("changes nothing when the lens stays the same", () => {
    const lens = { strength: 3 };
    const moved = keepPointsInPlace(corners, width, height, lens, lens);
    moved.forEach((p, i) => {
      expect(p.x).toBeCloseTo(corners[i].x, 6);
      expect(p.y).toBeCloseTo(corners[i].y, 6);
    });
  });
});
