export function erosionFilter(
  erosions: number,
  /**
   * When true, append `url(#recolor)` to the filter chain.
   * The recolor filter maps black → the target colour and white → black
   * via a single feColorMatrix SVG filter.
   */
  useRecolour: boolean = false,
): string {
  const result = [];
  while (erosions > 0) {
    if (erosions >= 3) {
      result.push("url(#erode-3)");
      erosions -= 3;
    } else if (erosions >= 2) {
      result.push("url(#erode-2)");
      erosions -= 2;
    } else {
      result.push("url(#erode-1)");
      erosions -= 1;
    }
  }
  // Always push dark grey pixels toward black and boost contrast.
  // At 0 erosions this cleans up grey anti-aliasing in the raw PDF render.
  // At >0 erosions it counteracts the blurring/fading that feMorphology introduces.
  result.push("url(#push-darks)");
  result.push("contrast(1.5)");
  if (useRecolour) {
    result.push("url(#recolor)");
  }
  return result.join(" ");
}

// Cached lookup table for fast gamma + contrast transformation.
let _lut: Uint8Array | null = null;
let _lutGamma: number | null = null;
let _lutContrast: number | null = null;

/**
 * Fast enhancement using a lookup table: applies gamma correction to darken
 * midtones toward black, then a contrast boost to separate lines from background.
 * Used on Safari where SVG filter references on canvas CSS aren't supported.
 * The LUT is built once and reused, making it 10-100× faster than Math.pow() per pixel.
 */
export function enhanceLineQualityFast(
  imageData: ImageData,
  gamma: number = 2,
  contrast: number = 1.5,
) {
  if (_lut === null || _lutGamma !== gamma || _lutContrast !== contrast) {
    _lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      let v = i / 255;
      v = Math.pow(v, gamma);
      v = (v - 0.5) * contrast + 0.5;
      _lut[i] = Math.max(0, Math.min(255, Math.round(v * 255)));
    }
    _lutGamma = gamma;
    _lutContrast = contrast;
  }
  const data = imageData.data;
  const len = data.length;
  for (let i = 0; i < len; i += 4) {
    data[i] = _lut[data[i]];
    data[i + 1] = _lut[data[i + 1]];
    data[i + 2] = _lut[data[i + 2]];
    // Alpha unchanged
  }
}

export function erodeImageData(imageData: ImageData, output: ImageData) {
  const { width, height } = imageData;
  const erodedData = output.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      for (let i = 0; i < 4; i++) {
        erodedData[index + i] = erodeAtIndex(
          imageData,
          x,
          y,
          index + i,
          width,
          height,
        );
      }
    }
  }
}

function erodeAtIndex(
  imageData: ImageData,
  x: number,
  y: number,
  index: number,
  width: number,
  height: number,
): number {
  const { data } = imageData;
  let c = data[index];
  if (x > 0) {
    const n = data[index - 4];
    if (n < c) {
      c = n;
    }
  }
  if (x < width - 1) {
    const n = data[index + 4];
    if (n < c) {
      c = n;
    }
  }
  if (y > 0) {
    const n = data[index - width * 4];
    if (n < c) {
      c = n;
    }
  }
  if (y < height - 1) {
    const n = data[index + width * 4];
    if (n < c) {
      c = n;
    }
  }
  return c;
}

/**
 * Recolour ImageData in-place: maps black pixels to the target hex colour and
 * white pixels to black, with luminance-proportional shading for grey tones.
 * This is the pixel-level equivalent of the `#recolor` feColorMatrix SVG filter.
 *
 * Formula: output = targetColour × (1 - luminance(input))
 *   Black input (luminance=0) → full target colour
 *   White input (luminance=1) → black  (invisible on dark background)
 *   Grey inputs → proportionally dimmer shades of the target colour
 */
export function recolourImageData(imageData: ImageData, hex: string) {
  const v = hex.replace("#", "");
  const n = v.length === 3 ? `${v[0]}${v[0]}${v[1]}${v[1]}${v[2]}${v[2]}` : v;
  const parsed = Number.parseInt(n, 16);
  const tR = ((parsed >> 16) & 255) / 255;
  const tG = ((parsed >> 8) & 255) / 255;
  const tB = (parsed & 255) / 255;

  const data = imageData.data;
  const len = data.length;
  for (let i = 0; i < len; i += 4) {
    const luminance =
      (data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722) / 255;
    const intensity = 1 - luminance;
    data[i] = Math.round(intensity * tR * 255);
    data[i + 1] = Math.round(intensity * tG * 255);
    data[i + 2] = Math.round(intensity * tB * 255);
    // Alpha unchanged
  }
}
