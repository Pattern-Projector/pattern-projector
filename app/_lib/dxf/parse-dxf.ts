/**
 * Minimal ASCII DXF reader for 2D sewing-pattern files (AAMA/ASTM style, as written
 * by CLO, Optitex, Gerber, Seamly2D, ...). It reads only what pattern files use:
 * BLOCK definitions, INSERTs, POLYLINE/VERTEX, LWPOLYLINE, LINE, POINT, CIRCLE and TEXT.
 */

export interface Vec {
  x: number;
  y: number;
}

interface BaseEntity {
  layer: string;
}

export interface PolylineEntity extends BaseEntity {
  type: "POLYLINE";
  points: Vec[];
  closed: boolean;
}

export interface LineEntity extends BaseEntity {
  type: "LINE";
  start: Vec;
  end: Vec;
}

export interface PointEntity extends BaseEntity {
  type: "POINT";
  at: Vec;
}

export interface CircleEntity extends BaseEntity {
  type: "CIRCLE";
  center: Vec;
  radius: number;
}

export interface TextEntity extends BaseEntity {
  type: "TEXT";
  at: Vec;
  text: string;
  /** Degrees, counter-clockwise */
  rotation: number;
}

export interface InsertEntity extends BaseEntity {
  type: "INSERT";
  block: string;
  at: Vec;
  scale: Vec;
  rotation: number;
}

export type DxfEntity =
  | PolylineEntity
  | LineEntity
  | PointEntity
  | CircleEntity
  | TextEntity
  | InsertEntity;

export interface DxfBlock {
  name: string;
  base: Vec;
  entities: DxfEntity[];
}

export interface DxfDocument {
  header: Record<string, string>;
  blocks: Record<string, DxfBlock>;
  entities: DxfEntity[];
}

interface Pair {
  code: number;
  value: string;
}

function toPairs(text: string): Pair[] {
  const lines = text.split(/\r\n|\r|\n/);
  const pairs: Pair[] = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = parseInt(lines[i].trim(), 10);
    if (Number.isNaN(code)) {
      throw new Error(`Invalid DXF group code on line ${i + 1}`);
    }
    pairs.push({ code, value: lines[i + 1].trim() });
  }
  return pairs;
}

/** Collects the group codes of one entity (until the next code 0). */
function readCodes(pairs: Pair[], start: number) {
  const codes: Pair[] = [];
  let i = start;
  while (i < pairs.length && pairs[i].code !== 0) {
    codes.push(pairs[i]);
    i++;
  }
  return { codes, next: i };
}

function num(codes: Pair[], code: number, fallback = 0): number {
  const p = codes.find((c) => c.code === code);
  const v = p ? parseFloat(p.value) : NaN;
  return Number.isNaN(v) ? fallback : v;
}

function str(codes: Pair[], code: number, fallback = ""): string {
  return codes.find((c) => c.code === code)?.value ?? fallback;
}

/** Reads entities from pairs[start] until a terminating 0-code (ENDBLK / ENDSEC). */
function readEntities(
  pairs: Pair[],
  start: number,
  stopAt: string[],
): { entities: DxfEntity[]; next: number } {
  const entities: DxfEntity[] = [];
  let i = start;
  while (i < pairs.length) {
    const { code, value } = pairs[i];
    if (code !== 0) {
      i++;
      continue;
    }
    if (stopAt.includes(value)) {
      return { entities, next: i };
    }
    const { codes, next } = readCodes(pairs, i + 1);
    i = next;
    const layer = str(codes, 8, "0");
    switch (value) {
      case "POLYLINE": {
        const points: Vec[] = [];
        const closed = (num(codes, 70) & 1) === 1;
        while (i < pairs.length && pairs[i].value === "VERTEX") {
          const v = readCodes(pairs, i + 1);
          points.push({ x: num(v.codes, 10), y: num(v.codes, 20) });
          i = v.next;
        }
        if (pairs[i]?.value === "SEQEND") {
          i = readCodes(pairs, i + 1).next;
        }
        entities.push({ type: "POLYLINE", layer, points, closed });
        break;
      }
      case "LWPOLYLINE": {
        const xs = codes.filter((c) => c.code === 10).map((c) => +c.value);
        const ys = codes.filter((c) => c.code === 20).map((c) => +c.value);
        entities.push({
          type: "POLYLINE",
          layer,
          points: xs.map((x, k) => ({ x, y: ys[k] ?? 0 })),
          closed: (num(codes, 70) & 1) === 1,
        });
        break;
      }
      case "LINE":
        entities.push({
          type: "LINE",
          layer,
          start: { x: num(codes, 10), y: num(codes, 20) },
          end: { x: num(codes, 11), y: num(codes, 21) },
        });
        break;
      case "POINT":
        entities.push({
          type: "POINT",
          layer,
          at: { x: num(codes, 10), y: num(codes, 20) },
        });
        break;
      case "CIRCLE":
        entities.push({
          type: "CIRCLE",
          layer,
          center: { x: num(codes, 10), y: num(codes, 20) },
          radius: num(codes, 40),
        });
        break;
      case "TEXT":
      case "MTEXT":
        entities.push({
          type: "TEXT",
          layer,
          at: { x: num(codes, 10), y: num(codes, 20) },
          text: codes
            .filter((c) => c.code === 1 || c.code === 3)
            .map((c) => c.value)
            .join(""),
          rotation: num(codes, 50),
        });
        break;
      case "INSERT":
        entities.push({
          type: "INSERT",
          layer,
          block: str(codes, 2),
          at: { x: num(codes, 10), y: num(codes, 20) },
          scale: { x: num(codes, 41, 1), y: num(codes, 42, 1) },
          rotation: num(codes, 50),
        });
        break;
      default:
        // Unsupported entity: skip (its codes were already consumed)
        break;
    }
  }
  return { entities, next: i };
}

export function parseDxf(text: string): DxfDocument {
  const pairs = toPairs(text);
  const doc: DxfDocument = { header: {}, blocks: {}, entities: [] };
  let i = 0;
  while (i < pairs.length) {
    if (!(pairs[i].code === 0 && pairs[i].value === "SECTION")) {
      i++;
      continue;
    }
    const section = pairs[i + 1]?.value;
    i += 2;
    if (section === "HEADER") {
      let variable = "";
      while (i < pairs.length && pairs[i].value !== "ENDSEC") {
        if (pairs[i].code === 9) {
          variable = pairs[i].value;
        } else if (variable && !(variable in doc.header)) {
          doc.header[variable] = pairs[i].value;
        }
        i++;
      }
    } else if (section === "BLOCKS") {
      while (i < pairs.length && pairs[i].value !== "ENDSEC") {
        if (pairs[i].code === 0 && pairs[i].value === "BLOCK") {
          const { codes, next } = readCodes(pairs, i + 1);
          const name = str(codes, 2);
          const base = { x: num(codes, 10), y: num(codes, 20) };
          const { entities, next: after } = readEntities(pairs, next, [
            "ENDBLK",
          ]);
          doc.blocks[name] = { name, base, entities };
          i = readCodes(pairs, after + 1).next;
        } else {
          i++;
        }
      }
    } else if (section === "ENTITIES") {
      const { entities, next } = readEntities(pairs, i, ["ENDSEC"]);
      doc.entities = entities;
      i = next;
    } else {
      while (i < pairs.length && pairs[i].value !== "ENDSEC") i++;
    }
  }
  return doc;
}
