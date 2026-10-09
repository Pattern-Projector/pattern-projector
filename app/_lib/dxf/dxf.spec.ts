import fs from "fs";
import { parseDxf } from "@/_lib/dxf/parse-dxf";
import {
  closestOnPolyline,
  polygonArea,
  readPatternFile,
} from "@/_lib/dxf/pattern-pieces";
import { dxfToSvg, packPieces } from "@/_lib/dxf/dxf-to-svg";
import { DxfElement, getDefaultDxfStyles } from "@/_lib/dxf/dxf-styles";

/** Builds a small DXF laid out the way CLO 2024 writes it (R12, one BLOCK per piece). */
function cloStyleDxf(units = "METRIC") {
  const out: string[] = [];
  const pair = (code: number, value: string | number) =>
    out.push(String(code).padStart(3, " "), String(value));
  const poly = (layer: string, pts: number[][], closed: boolean) => {
    pair(0, "POLYLINE");
    pair(8, layer);
    pair(66, 1);
    pair(70, closed ? 1 : 0);
    for (const [x, y] of pts) {
      pair(0, "VERTEX");
      pair(8, layer);
      pair(10, x.toFixed(6));
      pair(20, y.toFixed(6));
    }
    pair(0, "SEQEND");
  };
  const text = (layer: string, x: number, y: number, s: string) => {
    pair(0, "TEXT");
    pair(8, layer);
    pair(10, x);
    pair(20, y);
    pair(1, s);
  };
  const point = (layer: string, x: number, y: number) => {
    pair(0, "POINT");
    pair(8, layer);
    pair(10, x);
    pair(20, y);
  };

  // Piece: 200 x 100 rectangle whose top edge is an arc bulging up by 20.
  const arc = Array.from({ length: 21 }, (_, i) => {
    const x = 200 - i * 10;
    return [x, 100 + 20 * Math.sin((Math.PI * (200 - x)) / 200)];
  });
  // Layer 1 (sew line in CLO): corners + only 3 points on the curve
  const coarse = [
    [0, 0],
    [200, 0],
    [200, 100],
    [150, 100 + 20 * Math.sin(Math.PI / 4)],
    [100, 120],
    [50, 100 + 20 * Math.sin(Math.PI / 4)],
    [0, 100],
  ];
  // Layer 84: the dense arc only, then the bottom corners are dropped
  const dense = [...arc];
  // Layer 14 (cut line in CLO): 10mm seam allowance, densely sampled
  const outer = [
    [-10, -10],
    [210, -10],
    [210, 100],
    ...arc.map(([x, y]) => [x, y + 10]),
    [-10, 100],
  ];

  pair(0, "SECTION");
  pair(2, "HEADER");
  pair(9, "$ACADVER");
  pair(1, "AC1009");
  pair(0, "ENDSEC");
  pair(0, "SECTION");
  pair(2, "BLOCKS");
  pair(0, "BLOCK");
  pair(8, "0");
  pair(2, "Pattern_1_M");
  pair(70, 64);
  pair(10, 0);
  pair(20, 0);
  text("1", 10, 50, "PIECE NAME: Pattern_1");
  text("1", 10, 45, "SIZE: M");
  poly("1", coarse, true);
  text("1", 0, 0, "# 12");
  for (const [x, y] of coarse) point("2", x, y);
  poly("84", dense, true);
  text("1", 80, 50, "Front v1");
  pair(0, "LINE");
  pair(8, "7");
  pair(10, 100);
  pair(20, 10);
  pair(11, 100);
  pair(21, 90);
  poly(
    "8",
    [
      [50, 0],
      [50, 100],
    ],
    false,
  );
  text("8", 50, 0, "# 3");
  // Notch on the bottom edge, written twice: on the cut line and on the sew line
  point("4", 120, -10);
  point("4", 120, 0);
  // Notch on the left edge without a partner
  point("4", -10, 50);
  poly("14", outer, true);
  pair(0, "ENDBLK");
  pair(0, "ENDSEC");
  pair(0, "SECTION");
  pair(2, "ENTITIES");
  text("1", 0, 0, `UNITS: ${units}`);
  pair(0, "INSERT");
  pair(8, "0");
  pair(2, "Pattern_1_M");
  pair(10, 0);
  pair(20, 0);
  pair(0, "ENDSEC");
  pair(0, "EOF");
  return out.join("\r\n");
}

describe("parseDxf", () => {
  it("reads blocks, polylines and inserts", () => {
    const doc = parseDxf(cloStyleDxf());
    expect(Object.keys(doc.blocks)).toEqual(["Pattern_1_M"]);
    const kinds = doc.blocks["Pattern_1_M"].entities.map((e) => e.type);
    expect(kinds.filter((k) => k === "POLYLINE")).toHaveLength(4);
    expect(doc.entities.map((e) => e.type)).toEqual(["TEXT", "INSERT"]);
  });
});

describe("readPatternFile", () => {
  const { pieces, unitScale } = readPatternFile(cloStyleDxf());
  const piece = pieces[0];

  it("uses the outer outline as the cut line even when it is on layer 14", () => {
    expect(unitScale).toBe(1);
    expect(piece.name).toBe("Pattern_1");
    expect(piece.sew).not.toBeNull();
    expect(polygonArea(piece.cut)).toBeGreaterThan(polygonArea(piece.sew!));
  });

  it("rebuilds the curved sew line from layer 84 but keeps sharp corners", () => {
    const sew = piece.sew!;
    // every point of the true arc is on the sew line
    for (let i = 0; i <= 20; i++) {
      const x = 200 - i * 10;
      const y = 100 + 20 * Math.sin((Math.PI * (200 - x)) / 200);
      expect(closestOnPolyline({ x, y }, sew).d).toBeLessThan(0.01);
    }
    // corners dropped by layer 84 are still there, and no chord cuts across
    expect(sew).toContainEqual({ x: 0, y: 0 });
    expect(sew).toContainEqual({ x: 200, y: 0 });
    // The cut line is the arc shifted up 10mm, so its distance to the true curve is
    // between 9.5 and 10mm. The coarse chords alone would be up to ~11.4mm away.
    for (const p of piece.cut.filter((p) => p.y > 110)) {
      const d = closestOnPolyline(p, sew).d;
      expect(d).toBeGreaterThan(9.5);
      expect(d).toBeLessThan(10.01);
    }
  });

  it("points paired notches at their sew-line partner and others inward", () => {
    expect(piece.notches).toHaveLength(2);
    const bottom = piece.notches.find((n) => n.at.y === -10)!;
    expect(bottom.dir.x).toBeCloseTo(0);
    expect(bottom.dir.y).toBeCloseTo(1);
    const left = piece.notches.find((n) => n.at.x === -10)!;
    expect(left.dir.x).toBeCloseTo(1);
  });

  it("keeps the user's annotations and drops CLO ids and point numbers", () => {
    expect(piece.labels.map((l) => l.text)).toEqual(["Front v1"]);
    expect(piece.grain).not.toBeNull();
    expect(piece.internal).toHaveLength(1);
  });

  it("converts inch files to millimetres", () => {
    const inch = readPatternFile(cloStyleDxf("ENGLISH"));
    expect(inch.unitScale).toBe(25.4);
    const w = Math.max(...inch.pieces[0].cut.map((p) => p.x));
    expect(w).toBeCloseTo(210 * 25.4, 3);
  });
});

describe("dxfToSvg", () => {
  it("draws one Inkscape layer per element type at true size in mm", () => {
    const { svg, widthMm, pieceCount } = dxfToSvg(cloStyleDxf());
    expect(pieceCount).toBe(1);
    expect(widthMm).toBeCloseTo(220 + 20, 3); // outline + 10mm margin each side
    expect(svg).toContain(`width="${widthMm.toFixed(3)}mm"`);
    for (const id of ["dxf-cut", "dxf-sew", "dxf-notch", "dxf-grain"]) {
      expect(svg).toMatch(
        new RegExp(`<g id="${id}" inkscape:groupmode="layer"`),
      );
    }
    expect(svg).not.toContain("dxf-drill"); // empty groups are left out
    expect(svg).toContain(">Front v1</text>");
    expect(svg).not.toContain("PIECE NAME");
  });

  it("uses the configured styles and layer names", () => {
    const styles = getDefaultDxfStyles();
    styles[DxfElement.Cut] = { ...styles.cut, width: 1.5, color: "#ff0000" };
    const { svg } = dxfToSvg(cloStyleDxf(), {
      styles,
      layerNames: { [DxfElement.Cut]: "Schnittlinie" },
    });
    expect(svg).toMatch(
      /id="dxf-cut"[^>]*inkscape:label="Schnittlinie"[^>]*stroke="#ff0000" stroke-width="1.5"/,
    );
  });

  it("packs pieces without overlap or rotation", () => {
    const one = readPatternFile(cloStyleDxf()).pieces[0];
    const packed = packPieces([one, one, one]);
    const boxes = packed.map((p) => {
      const xs = p.cut.map((v) => v.x);
      const ys = p.cut.map((v) => v.y);
      return [
        Math.min(...xs),
        Math.min(...ys),
        Math.max(...xs),
        Math.max(...ys),
      ];
    });
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const [a, b] = [boxes[i], boxes[j]];
        const overlap =
          a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
        expect(overlap).toBe(false);
      }
      const g = packed[i].grain!;
      expect(g[1].x - g[0].x).toBeCloseTo(0); // still vertical
    }
  });
});

// Optional check against a real CLO export:
//   PATTERN_DXF=/path/to/file.dxf SEAM_ALLOWANCES_MM=12.7,30 yarn test:unit
const realFile = process.env.PATTERN_DXF;
const allowances = (process.env.SEAM_ALLOWANCES_MM ?? "12.7")
  .split(",")
  .map(Number);
(realFile ? describe : describe.skip)("real CLO export", () => {
  it("rebuilds every sew line at the piece's seam allowance", () => {
    const { pieces } = readPatternFile(fs.readFileSync(realFile!, "utf8"));
    expect(pieces.length).toBeGreaterThan(0);
    for (const p of pieces) {
      if (!p.sew) continue;
      const errors = p.cut
        .map((v) => {
          const d = closestOnPolyline(v, p.sew!).d;
          return Math.min(...allowances.map((sa) => Math.abs(d - sa)));
        })
        .sort((a, b) => a - b);
      // Most cut-line vertices sit exactly one seam allowance from the sew line
      // (corners of mitred allowances are naturally further away)
      expect(errors[Math.floor(errors.length / 2)]).toBeLessThan(0.05);
    }
  });
});
