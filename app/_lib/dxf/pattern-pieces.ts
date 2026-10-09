import {
  DxfDocument,
  DxfEntity,
  PolylineEntity,
  TextEntity,
  Vec,
  parseDxf,
} from "@/_lib/dxf/parse-dxf";

/**
 * AAMA / ASTM D6673 pattern layers. CLO, Optitex, Gerber and most pattern CAD
 * programs write these numbered layers inside one BLOCK per pattern piece.
 */
export const AAMA = {
  boundary: "1",
  turnPoints: "2",
  curvePoints: "3",
  notches: "4",
  mirrorLine: "6",
  grainLine: "7",
  internalLines: "8",
  internalCutouts: "11",
  drillHoles: "13",
  sewLines: "14",
  annotation: "15",
  boundaryCurve: "84",
  internalCurve: "85",
  cutoutCurve: "86",
  sewCurve: "87",
} as const;

export interface Notch {
  /** Point on the cut line */
  at: Vec;
  /** Unit vector pointing into the piece */
  dir: Vec;
}

export interface PieceLabel {
  at: Vec;
  text: string;
  rotation: number;
}

export interface PatternPiece {
  name: string;
  cut: Vec[];
  sew: Vec[] | null;
  cutouts: Vec[][];
  notches: Notch[];
  internal: Vec[][];
  mirror: Vec[][];
  grain: [Vec, Vec] | null;
  drills: Vec[];
  labels: PieceLabel[];
}

export interface PatternFile {
  pieces: PatternPiece[];
  /** Millimetres per drawing unit */
  unitScale: number;
}

const TOL = 0.05; // drawing-unit tolerance when matching vertices across layers

// ---------- geometry helpers ----------

export function dist(a: Vec, b: Vec) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function polygonArea(pts: Vec[]) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}

function closestOnSegment(p: Vec, a: Vec, b: Vec) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  const t =
    l2 === 0
      ? 0
      : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  const q = { x: a.x + t * dx, y: a.y + t * dy };
  return { d: dist(p, q), a, b };
}

export function closestOnPolyline(p: Vec, pts: Vec[], closed = true) {
  let best = { d: Infinity, a: pts[0], b: pts[0] };
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const r = closestOnSegment(p, pts[i], pts[(i + 1) % pts.length]);
    if (r.d < best.d) best = r;
  }
  return best;
}

export function pointInPolygon(p: Vec, pts: Vec[]) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    ) {
      inside = !inside;
    }
  }
  return inside;
}

function pathLength(pts: Vec[]) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]);
  return l;
}

/**
 * Pattern CAD exports the "real" outline (layer 1 / 8 / 11 / 14) as a coarse
 * polyline through the turn and curve points only, and a dense version of the
 * curved stretches on the matching quality-validation layer (84 / 85 / 86 / 87).
 * The dense layer is not usable on its own: CLO drops some corner points and
 * closes it with a chord. So we keep the coarse polyline and replace each edge
 * by the dense run between the same two vertices, where one exists.
 */
export function spliceDenseCurves(
  coarse: Vec[],
  dense: Vec[][],
  closed: boolean,
): Vec[] {
  if (dense.length === 0 || coarse.length < 2) return coarse;

  const locate = (p: Vec) => {
    for (let c = 0; c < dense.length; c++) {
      const pts = dense[c];
      for (let i = 0; i < pts.length; i++) {
        if (dist(p, pts[i]) < TOL) return { c, i };
      }
    }
    return null;
  };
  const found = coarse.map(locate);
  const used = new Set(
    found.filter((f) => f !== null).map((f) => `${f!.c}:${f!.i}`),
  );

  const out: Vec[] = [];
  const edges = closed ? coarse.length : coarse.length - 1;
  for (let k = 0; k < coarse.length; k++) {
    out.push(coarse[k]);
    if (k >= edges) break;
    const fa = found[k];
    const fb = found[(k + 1) % coarse.length];
    if (!fa || !fb || fa.c !== fb.c) continue;
    const pts = dense[fa.c];
    const n = pts.length;
    // Only wrap around the end of the dense curve if it really closes on itself
    const closesItself = n > 2 && dist(pts[0], pts[n - 1]) < 1;
    const run: Vec[] = [];
    let ok = true;
    for (let i = (fa.i + 1) % n; i !== fb.i; i = (i + 1) % n) {
      if (i === 0 && !closesItself) {
        ok = false;
        break;
      }
      if (used.has(`${fa.c}:${i}`) || run.length > n) {
        ok = false;
        break;
      }
      run.push(pts[i]);
    }
    if (fb.i === 0 && fa.i !== n - 1 && !closesItself) ok = false;
    if (!ok) continue;
    const a = coarse[k];
    const b = coarse[(k + 1) % coarse.length];
    // A curve between two points is never much longer than the chord; if it is,
    // the run went the wrong way round.
    if (pathLength([a, ...run, b]) > 3 * dist(a, b) + 5) continue;
    out.push(...run);
  }
  return out;
}

// ---------- piece extraction ----------

function transformFor(
  insert: { at: Vec; scale: Vec; rotation: number },
  base: Vec,
  unit: number,
) {
  const r = (insert.rotation * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return (p: Vec): Vec => {
    const x = (p.x - base.x) * insert.scale.x;
    const y = (p.y - base.y) * insert.scale.y;
    return {
      x: (insert.at.x + x * cos - y * sin) * unit,
      y: (insert.at.y + x * sin + y * cos) * unit,
    };
  };
}

const CLO_INFO_TEXT = /^(PIECE NAME|SIZE|QUANTITY|CATEGORY|ANNOTATION):/i;
const POINT_ID_TEXT = /^#\s*\d+$/;

function pieceFromEntities(
  entities: DxfEntity[],
  T: (p: Vec) => Vec,
  fallbackName: string,
): PatternPiece | null {
  const polys = (layer: string) =>
    entities.filter(
      (e): e is PolylineEntity => e.type === "POLYLINE" && e.layer === layer,
    );
  const pts = (e: PolylineEntity) => e.points.map(T);

  const boundaryEntity = polys(AAMA.boundary)[0];
  if (!boundaryEntity) return null;
  const dense = (layer: string) => polys(layer).map(pts);

  const boundary = spliceDenseCurves(
    pts(boundaryEntity),
    dense(AAMA.boundaryCurve),
    true,
  );
  const sewEntity = polys(AAMA.sewLines).find((e) => e.closed);
  const sewLine = sewEntity
    ? spliceDenseCurves(pts(sewEntity), dense(AAMA.sewCurve), true)
    : null;

  // The standard says layer 1 = cut line and 14 = sew line, but CLO writes it the
  // other way round. Whichever encloses the other is the cut line.
  let cut = boundary;
  let sew: Vec[] | null = sewLine;
  if (sewLine && polygonArea(sewLine) > polygonArea(boundary)) {
    cut = sewLine;
    sew = boundary;
  }

  const internal = polys(AAMA.internalLines).map((e) =>
    spliceDenseCurves(pts(e), dense(AAMA.internalCurve), e.closed),
  );
  // Open sew-line polylines (some CADs export partial sew lines)
  const extraSew = polys(AAMA.sewLines).filter((e) => !e.closed);
  internal.push(...extraSew.map(pts));
  const cutouts = polys(AAMA.internalCutouts).map((e) =>
    spliceDenseCurves(pts(e), dense(AAMA.cutoutCurve), true),
  );
  const mirror = [
    ...polys(AAMA.mirrorLine).map(pts),
    ...entities
      .filter((e) => e.type === "LINE" && e.layer === AAMA.mirrorLine)
      .map((e) => (e.type === "LINE" ? [T(e.start), T(e.end)] : [])),
  ];

  const grainEntity = entities.find(
    (e) =>
      e.layer === AAMA.grainLine &&
      (e.type === "LINE" || e.type === "POLYLINE"),
  );
  let grain: [Vec, Vec] | null = null;
  if (grainEntity?.type === "LINE") {
    grain = [T(grainEntity.start), T(grainEntity.end)];
  } else if (
    grainEntity?.type === "POLYLINE" &&
    grainEntity.points.length > 1
  ) {
    grain = [
      T(grainEntity.points[0]),
      T(grainEntity.points[grainEntity.points.length - 1]),
    ];
  }

  const drills: Vec[] = entities.flatMap((e) =>
    e.layer === AAMA.drillHoles && e.type === "POINT"
      ? [T(e.at)]
      : e.layer === AAMA.drillHoles && e.type === "CIRCLE"
        ? [T(e.center)]
        : [],
  );

  const notches = buildNotches(entities, T, cut, sew);

  const texts = entities.filter((e): e is TextEntity => e.type === "TEXT");
  const nameText = texts.find((t) => /^PIECE NAME:/i.test(t.text));
  const name = nameText
    ? nameText.text.replace(/^PIECE NAME:\s*/i, "")
    : fallbackName;
  const labels = texts
    .filter(
      (t) =>
        (t.layer === AAMA.boundary || t.layer === AAMA.annotation) &&
        t.text.trim() !== "" &&
        !CLO_INFO_TEXT.test(t.text) &&
        !POINT_ID_TEXT.test(t.text.trim()),
    )
    .map((t) => ({ at: T(t.at), text: t.text, rotation: t.rotation }));

  return {
    name,
    cut,
    sew,
    cutouts,
    notches,
    internal,
    mirror,
    grain,
    drills,
    labels,
  };
}

function buildNotches(
  entities: DxfEntity[],
  T: (p: Vec) => Vec,
  cut: Vec[],
  sew: Vec[] | null,
): Notch[] {
  const notches: Notch[] = [];
  // Notches drawn as LINEs (Gerber, Optitex): direction is given
  for (const e of entities) {
    if (e.type === "LINE" && e.layer === AAMA.notches) {
      const a = T(e.start);
      const b = T(e.end);
      const [onCut, other] =
        closestOnPolyline(a, cut).d <= closestOnPolyline(b, cut).d
          ? [a, b]
          : [b, a];
      const d = dist(onCut, other);
      if (d > 0) {
        notches.push({
          at: onCut,
          dir: { x: (other.x - onCut.x) / d, y: (other.y - onCut.y) / d },
        });
      }
    }
  }
  // Notches as POINTs (CLO): CLO writes each notch once on the cut line and once on
  // the sew line; the pair gives the direction. Unpaired ones use the inward normal.
  const points = entities
    .filter((e) => e.type === "POINT" && e.layer === AAMA.notches)
    .map((e) => (e.type === "POINT" ? T(e.at) : { x: 0, y: 0 }));
  const tol = TOL * 4;
  const onCut = points.filter((p) => closestOnPolyline(p, cut).d < tol);
  const offCut = points.filter((p) => !onCut.includes(p));
  for (const p of onCut) {
    let partner: Vec | null = null;
    if (sew) {
      for (const q of offCut) {
        if (
          closestOnPolyline(q, sew).d < tol &&
          dist(p, q) < 80 &&
          (partner === null || dist(p, q) < dist(p, partner))
        ) {
          partner = q;
        }
      }
    }
    if (partner) {
      const d = dist(p, partner);
      notches.push({
        at: p,
        dir: { x: (partner.x - p.x) / d, y: (partner.y - p.y) / d },
      });
    } else {
      notches.push({ at: p, dir: inwardNormal(p, cut) });
    }
  }
  return notches;
}

function inwardNormal(p: Vec, outline: Vec[]): Vec {
  const { a, b } = closestOnPolyline(p, outline);
  const len = dist(a, b) || 1;
  let n = { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
  if (!pointInPolygon({ x: p.x + n.x, y: p.y + n.y }, outline)) {
    n = { x: -n.x, y: -n.y };
  }
  return n;
}

/** Millimetres per drawing unit. */
export function detectUnitScale(doc: DxfDocument): number {
  const texts = [
    ...doc.entities,
    ...Object.values(doc.blocks).flatMap((b) => b.entities),
  ].filter((e): e is TextEntity => e.type === "TEXT");
  const unitText = texts.find((t) => /^UNITS:/i.test(t.text));
  if (unitText) {
    return /ENGLISH|INCH|IMPERIAL/i.test(unitText.text) ? 25.4 : 1;
  }
  switch (doc.header["$INSUNITS"]) {
    case "1":
      return 25.4;
    case "5":
      return 10;
    case "4":
      return 1;
  }
  if (doc.header["$MEASUREMENT"] === "0") return 25.4;
  return 1;
}

export function readPatternFile(text: string): PatternFile {
  const doc = parseDxf(text);
  const unit = detectUnitScale(doc);
  const pieces: PatternPiece[] = [];

  const inserts = doc.entities.filter((e) => e.type === "INSERT");
  for (const ins of inserts) {
    if (ins.type !== "INSERT") continue;
    const block = doc.blocks[ins.block];
    if (!block) continue;
    const piece = pieceFromEntities(
      block.entities,
      transformFor(ins, block.base, unit),
      block.name,
    );
    if (piece) pieces.push(piece);
  }
  // Files without blocks: treat the whole entities section as one piece
  if (pieces.length === 0) {
    const identity = transformFor(
      { at: { x: 0, y: 0 }, scale: { x: 1, y: 1 }, rotation: 0 },
      { x: 0, y: 0 },
      unit,
    );
    const piece = pieceFromEntities(doc.entities, identity, "Pattern");
    if (piece) pieces.push(piece);
  }
  if (pieces.length === 0) {
    throw new Error(
      "No pattern pieces found: the DXF has no closed outline on layer 1",
    );
  }
  return { pieces, unitScale: unit };
}
