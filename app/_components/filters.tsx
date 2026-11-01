/**
 * Parse a hex colour string to 0–1 RGB values.
 */
function hexToUnit(hex: string): { r: number; g: number; b: number } {
  const v = hex.replace("#", "");
  const n = v.length === 3 ? `${v[0]}${v[0]}${v[1]}${v[1]}${v[2]}${v[2]}` : v;
  const parsed = Number.parseInt(n, 16);
  return {
    r: ((parsed >> 16) & 255) / 255,
    g: ((parsed >> 8) & 255) / 255,
    b: (parsed & 255) / 255,
  };
}

export default function Filters({ recolourHex }: { recolourHex?: string }) {
  // Build the feColorMatrix values for the recolor filter.
  // Maps black (0,0,0) → target colour, white (1,1,1) → black (0,0,0).
  // Formula: output = targetColour × (1 - luminance(input))
  //   row R: [-tR×0.2126, -tR×0.7152, -tR×0.0722, 0, tR]
  //   row G: [-tG×0.2126, -tG×0.7152, -tG×0.0722, 0, tG]
  //   row B: [-tB×0.2126, -tB×0.7152, -tB×0.0722, 0, tB]
  //   row A: [0,           0,           0,          1, 0 ]
  let recolourValues = "";
  if (recolourHex) {
    const { r, g, b } = hexToUnit(recolourHex);
    recolourValues = [
      `${(-r * 0.2126).toFixed(4)} ${(-r * 0.7152).toFixed(4)} ${(-r * 0.0722).toFixed(4)} 0 ${r.toFixed(4)}`,
      `${(-g * 0.2126).toFixed(4)} ${(-g * 0.7152).toFixed(4)} ${(-g * 0.0722).toFixed(4)} 0 ${g.toFixed(4)}`,
      `${(-b * 0.2126).toFixed(4)} ${(-b * 0.7152).toFixed(4)} ${(-b * 0.0722).toFixed(4)} 0 ${b.toFixed(4)}`,
      "0 0 0 1 0",
    ].join("\n");
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg">
      <filter id="erode-1">
        <feMorphology operator="erode" radius="1" />
      </filter>
      <filter id="erode-2">
        <feMorphology operator="erode" radius="2" />
      </filter>
      <filter id="erode-3">
        <feMorphology operator="erode" radius="3" />
      </filter>

      {/* Push dark grey pixels toward black using gamma correction.
          After erosion, anti-aliased edges become grey. This filter
          darkens those greys back toward black so lines appear solid. */}
      <filter id="push-darks">
        <feComponentTransfer>
          <feFuncR type="gamma" amplitude="1" exponent="2" offset="0" />
          <feFuncG type="gamma" amplitude="1" exponent="2" offset="0" />
          <feFuncB type="gamma" amplitude="1" exponent="2" offset="0" />
        </feComponentTransfer>
      </filter>

      {/* Recolour filter: maps black → target colour, white → black,
          with luminance-proportional shading for grey tones.
          Replaces the old invert/sepia/hue-rotate chain with a single
          feColorMatrix that maps to the exact target hex colour. */}
      {recolourHex && (
        <filter id="recolor" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={recolourValues} />
        </filter>
      )}
    </svg>
  );
}
