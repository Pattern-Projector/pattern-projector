/**
 * Per-element line styles for patterns imported from DXF. Sizes are millimetres on the
 * mat (the SVG is drawn 1:1 in mm), so they hold regardless of zoom or projector.
 */

export enum DxfElement {
  Cut = "cut",
  Sew = "sew",
  Notch = "notch",
  Internal = "internal",
  Mirror = "mirror",
  Grain = "grain",
  Drill = "drill",
  Labels = "labels",
}

export enum DashStyle {
  Solid = "solid",
  Dashed = "dashed",
  Dotted = "dotted",
  DashDot = "dashdot",
}

export interface ElementStyle {
  /** Stroke width in mm (unused for labels) */
  width: number;
  color: string;
  dash: DashStyle;
  /** Notch depth, drill-mark radius or label text height, in mm */
  size?: number;
}

export type DxfStyles = Record<DxfElement, ElementStyle>;

export const dxfElements: DxfElement[] = [
  DxfElement.Cut,
  DxfElement.Sew,
  DxfElement.Notch,
  DxfElement.Internal,
  DxfElement.Mirror,
  DxfElement.Grain,
  DxfElement.Drill,
  DxfElement.Labels,
];

/** SVG group id for an element type; also the key in the app's Layers state. */
export function groupId(element: DxfElement) {
  return `dxf-${element}`;
}

export function elementFromGroupId(id: string): DxfElement | null {
  const e = id.replace(/^dxf-/, "") as DxfElement;
  return dxfElements.includes(e) ? e : null;
}

export function getDefaultDxfStyles(): DxfStyles {
  return {
    [DxfElement.Cut]: { width: 0.8, color: "#000000", dash: DashStyle.Solid },
    [DxfElement.Sew]: { width: 0.3, color: "#000000", dash: DashStyle.Dashed },
    [DxfElement.Notch]: {
      width: 0.6,
      color: "#000000",
      dash: DashStyle.Solid,
      size: 6,
    },
    [DxfElement.Internal]: {
      width: 0.3,
      color: "#000000",
      dash: DashStyle.Dashed,
    },
    [DxfElement.Mirror]: {
      width: 0.3,
      color: "#000000",
      dash: DashStyle.DashDot,
    },
    [DxfElement.Grain]: { width: 0.4, color: "#000000", dash: DashStyle.Solid },
    [DxfElement.Drill]: {
      width: 0.4,
      color: "#000000",
      dash: DashStyle.Solid,
      size: 2.5,
    },
    [DxfElement.Labels]: {
      width: 0,
      color: "#000000",
      dash: DashStyle.Solid,
      size: 8,
    },
  };
}

/** Elements that use the `size` field, and what it means. */
export const sizedElements: Partial<
  Record<DxfElement, "depth" | "radius" | "textSize">
> = {
  [DxfElement.Notch]: "depth",
  [DxfElement.Drill]: "radius",
  [DxfElement.Labels]: "textSize",
};

export function dashArray(dash: DashStyle, width: number): string {
  // Dash lengths scale gently with line width so thick lines still read as dashed
  const u = Math.max(1, width * 2);
  switch (dash) {
    case DashStyle.Solid:
      return "none";
    case DashStyle.Dashed:
      return `${4 * u} ${2 * u}`;
    case DashStyle.Dotted:
      return `0.01 ${1.5 * u}`;
    case DashStyle.DashDot:
      return `${6 * u} ${1.5 * u} 0.01 ${1.5 * u}`;
  }
}

const STORAGE_KEY = "dxfStyles";

export function loadDxfStyles(): DxfStyles {
  const defaults = getDefaultDxfStyles();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const saved = JSON.parse(raw) as Partial<DxfStyles>;
    for (const e of dxfElements) {
      if (saved[e]) defaults[e] = { ...defaults[e], ...saved[e] };
    }
  } catch {
    // ignore unreadable settings
  }
  return defaults;
}

export function saveDxfStyles(styles: DxfStyles) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(styles));
  } catch {
    // storage full or blocked: styles still apply for this session
  }
}

/** Notch tick path from its stored anchor/direction and the current depth. */
function notchPath(el: Element, depth: number): string | null {
  const x = Number(el.getAttribute("data-x"));
  const y = Number(el.getAttribute("data-y"));
  const ux = Number(el.getAttribute("data-ux"));
  const uy = Number(el.getAttribute("data-uy"));
  if ([x, y, ux, uy].some((v) => Number.isNaN(v))) return null;
  return `M${x} ${y} L${x + ux * depth} ${y + uy * depth}`;
}

function drillPath(el: Element, r: number): string | null {
  const x = Number(el.getAttribute("data-x"));
  const y = Number(el.getAttribute("data-y"));
  if (Number.isNaN(x) || Number.isNaN(y)) return null;
  return `M${x - r} ${y} L${x + r} ${y} M${x} ${y - r} L${x} ${y + r}`;
}

/**
 * Applies styles to an SVG produced by dxfToSvg, either a live DOM (when the user
 * edits styles) or a freshly parsed document (when generating the file).
 */
export function applyDxfStyles(svg: Element, styles: DxfStyles) {
  for (const element of dxfElements) {
    const g = svg.querySelector(`#${groupId(element)}`);
    if (!g) continue;
    const s = styles[element];
    if (element === DxfElement.Labels) {
      g.setAttribute("fill", s.color);
      g.setAttribute("font-size", String(s.size ?? 8));
      continue;
    }
    g.setAttribute("stroke", s.color);
    g.setAttribute("stroke-width", String(s.width));
    g.setAttribute("stroke-dasharray", dashArray(s.dash, s.width));
    if (element === DxfElement.Notch) {
      g.querySelectorAll("path").forEach((p) => {
        const d = notchPath(p, s.size ?? 6);
        if (d) p.setAttribute("d", d);
      });
    }
    if (element === DxfElement.Drill) {
      g.querySelectorAll("path").forEach((p) => {
        const d = drillPath(p, s.size ?? 2.5);
        if (d) p.setAttribute("d", d);
      });
      g.querySelectorAll("circle").forEach((c) =>
        c.setAttribute("r", String(s.size ?? 2.5)),
      );
    }
    if (element === DxfElement.Grain) {
      const marker = svg.querySelector("#dxf-arrow path");
      marker?.setAttribute("fill", s.color);
    }
  }
}
