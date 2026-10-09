import {
  PatternFile,
  PatternPiece,
  readPatternFile,
} from "@/_lib/dxf/pattern-pieces";
import { Vec } from "@/_lib/dxf/parse-dxf";
import {
  DxfElement,
  DxfStyles,
  dashArray,
  dxfElements,
  getDefaultDxfStyles,
  groupId,
} from "@/_lib/dxf/dxf-styles";

export interface DxfToSvgOptions {
  styles?: DxfStyles;
  /** Layer names shown in the Layers menu, e.g. translated strings */
  layerNames?: Partial<Record<DxfElement, string>>;
  /** Re-arrange pieces into compact rows instead of CLO's 2D-window layout */
  pack?: boolean;
  /** Margin around the pattern, mm */
  margin?: number;
}

export interface DxfToSvgResult {
  svg: string;
  pieceCount: number;
  widthMm: number;
  heightMm: number;
}

const defaultLayerNames: Record<DxfElement, string> = {
  [DxfElement.Cut]: "Cut line",
  [DxfElement.Sew]: "Sew line",
  [DxfElement.Notch]: "Notches",
  [DxfElement.Internal]: "Internal lines",
  [DxfElement.Mirror]: "Fold line",
  [DxfElement.Grain]: "Grainline",
  [DxfElement.Drill]: "Drill holes",
  [DxfElement.Labels]: "Labels",
};

function bounds(pts: Vec[]) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

function movePiece(piece: PatternPiece, dx: number, dy: number): PatternPiece {
  const m = (p: Vec) => ({ x: p.x + dx, y: p.y + dy });
  const ml = (l: Vec[]) => l.map(m);
  return {
    ...piece,
    cut: ml(piece.cut),
    sew: piece.sew ? ml(piece.sew) : null,
    cutouts: piece.cutouts.map(ml),
    notches: piece.notches.map((n) => ({ ...n, at: m(n.at) })),
    internal: piece.internal.map(ml),
    mirror: piece.mirror.map(ml),
    grain: piece.grain ? [m(piece.grain[0]), m(piece.grain[1])] : null,
    drills: ml(piece.drills),
    labels: piece.labels.map((l) => ({ ...l, at: m(l.at) })),
  };
}

/** Simple shelf packing; never rotates pieces, so grainlines keep their direction. */
export function packPieces(pieces: PatternPiece[], gap = 20): PatternPiece[] {
  const boxes = pieces.map((p) => ({ piece: p, b: bounds(p.cut) }));
  const area = boxes.reduce(
    (s, { b }) => s + (b.maxX - b.minX + gap) * (b.maxY - b.minY + gap),
    0,
  );
  const widest = Math.max(...boxes.map(({ b }) => b.maxX - b.minX));
  const rowLimit = Math.max(widest, Math.sqrt(area) * 1.4);
  boxes.sort((a, b) => b.b.maxY - b.b.minY - (a.b.maxY - a.b.minY));

  const placed: PatternPiece[] = [];
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  for (const { piece, b } of boxes) {
    const w = b.maxX - b.minX;
    const h = b.maxY - b.minY;
    if (x > 0 && x + w > rowLimit) {
      x = 0;
      y -= rowHeight + gap; // DXF y grows upwards; rows go down the sheet
      rowHeight = 0;
    }
    placed.push(movePiece(piece, x - b.minX, y - b.maxY));
    x += w + gap;
    rowHeight = Math.max(rowHeight, h);
  }
  return placed;
}

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

export function patternToSvg(
  pattern: PatternFile,
  options: DxfToSvgOptions = {},
): DxfToSvgResult {
  const styles = options.styles ?? getDefaultDxfStyles();
  const names = { ...defaultLayerNames, ...options.layerNames };
  const margin = options.margin ?? 10;
  const pieces = options.pack ? packPieces(pattern.pieces) : pattern.pieces;

  const all = pieces.flatMap((p) => p.cut);
  const b = bounds(all);
  const minX = b.minX - margin;
  const maxY = b.maxY + margin;
  const W = b.maxX - b.minX + 2 * margin;
  const H = b.maxY - b.minY + 2 * margin;

  // DXF y points up, SVG y points down
  const fx = (p: Vec) => +(p.x - minX).toFixed(3);
  const fy = (p: Vec) => +(maxY - p.y).toFixed(3);
  const path = (pts: Vec[], closed: boolean) =>
    pts.length
      ? "M" +
        pts.map((p) => `${fx(p)} ${fy(p)}`).join(" L") +
        (closed ? " Z" : "")
      : "";

  const content: Record<DxfElement, string[]> = {
    [DxfElement.Cut]: [],
    [DxfElement.Sew]: [],
    [DxfElement.Notch]: [],
    [DxfElement.Internal]: [],
    [DxfElement.Mirror]: [],
    [DxfElement.Grain]: [],
    [DxfElement.Drill]: [],
    [DxfElement.Labels]: [],
  };

  for (const piece of pieces) {
    content.cut.push(`<path d="${path(piece.cut, true)}"/>`);
    for (const c of piece.cutouts) {
      content.cut.push(`<path d="${path(c, true)}"/>`);
    }
    if (piece.sew) content.sew.push(`<path d="${path(piece.sew, true)}"/>`);
    for (const l of piece.internal) {
      content.internal.push(`<path d="${path(l, false)}"/>`);
    }
    for (const l of piece.mirror) {
      content.mirror.push(`<path d="${path(l, false)}"/>`);
    }
    if (piece.grain) {
      content.grain.push(
        `<path d="${path(piece.grain, false)}" marker-start="url(#dxf-arrow)" marker-end="url(#dxf-arrow)"/>`,
      );
    }
    const depth = styles.notch.size ?? 6;
    for (const n of piece.notches) {
      // SVG direction: y is flipped
      const ux = +n.dir.x.toFixed(5);
      const uy = +(-n.dir.y).toFixed(5);
      const x = fx(n.at);
      const y = fy(n.at);
      content.notch.push(
        `<path data-x="${x}" data-y="${y}" data-ux="${ux}" data-uy="${uy}" d="M${x} ${y} L${+(x + ux * depth).toFixed(3)} ${+(y + uy * depth).toFixed(3)}"/>`,
      );
    }
    const r = styles.drill.size ?? 2.5;
    for (const d of piece.drills) {
      const x = fx(d);
      const y = fy(d);
      content.drill.push(
        `<path data-x="${x}" data-y="${y}" d="M${x - r} ${y} L${x + r} ${y} M${x} ${y - r} L${x} ${y + r}"/>`,
      );
    }
    for (const l of piece.labels) {
      const x = fx(l.at);
      const y = fy(l.at);
      const rot = l.rotation
        ? ` transform="rotate(${-l.rotation} ${x} ${y})"`
        : "";
      content.labels.push(
        `<text x="${x}" y="${y}"${rot}>${esc(l.text)}</text>`,
      );
    }
  }

  const groups: string[] = [];
  for (const element of dxfElements) {
    if (content[element].length === 0) continue;
    const s = styles[element];
    const attrs =
      element === DxfElement.Labels
        ? `font-family="sans-serif" font-size="${s.size ?? 8}" fill="${s.color}" stroke="none"`
        : `fill="none" stroke="${s.color}" stroke-width="${s.width}" stroke-dasharray="${dashArray(s.dash, s.width)}" stroke-linecap="round" stroke-linejoin="round"`;
    groups.push(
      `<g id="${groupId(element)}" inkscape:groupmode="layer" inkscape:label="${esc(names[element])}" ${attrs}>\n${content[element].join("\n")}\n</g>`,
    );
  }

  const w = W.toFixed(3);
  const h = H.toFixed(3);
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">`,
    `<defs><marker id="dxf-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" fill="${styles.grain.color}" stroke="none"/></marker></defs>`,
    ...groups,
    `</svg>`,
  ].join("\n");

  return { svg, pieceCount: pieces.length, widthMm: W, heightMm: H };
}

export function dxfToSvg(
  dxfText: string,
  options: DxfToSvgOptions = {},
): DxfToSvgResult {
  return patternToSvg(readPatternFile(dxfText), options);
}

export function isDxfFile(file: File): boolean {
  return /\.dxf$/i.test(file.name);
}

/** Name of the converted SVG; stable per DXF name so the app restores position and layers. */
export function svgNameForDxf(dxfName: string) {
  return `${dxfName}.svg`;
}

export async function convertDxfFile(
  file: File,
  options: DxfToSvgOptions = {},
): Promise<{ svgFile: File; result: DxfToSvgResult; text: string }> {
  const text = await file.text();
  const result = dxfToSvg(text, options);
  const svgFile = new File([result.svg], svgNameForDxf(file.name), {
    type: "image/svg+xml",
    lastModified: file.lastModified,
  });
  return { svgFile, result, text };
}
