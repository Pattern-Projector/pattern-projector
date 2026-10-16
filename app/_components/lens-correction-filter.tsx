import { useEffect, useState } from "react";
import {
  LensCorrection,
  createDisplacementMap,
  isLensCorrectionActive,
} from "@/_lib/lens-correction";

export const lensCorrectionFilterId = "lens-correction";

/** CSS filter value that applies the lens correction, or "none" when it is off. */
export function lensCorrectionFilter(lensCorrection: LensCorrection) {
  return isLensCorrectionActive(lensCorrection)
    ? `url(#${lensCorrectionFilterId})`
    : "none";
}

/**
 * SVG filter that warps whatever it is applied to so straight lines stay straight after passing through the
 * projector lens. Apply it with lensCorrectionFilter() to a full screen element.
 */
export default function LensCorrectionFilter({
  lensCorrection,
  width,
  height,
}: {
  lensCorrection: LensCorrection;
  width: number;
  height: number;
}) {
  const [map, setMap] = useState<{ href: string; scale: number } | null>(null);

  useEffect(() => {
    if (!isLensCorrectionActive(lensCorrection) || width <= 0 || height <= 0) {
      setMap(null);
      return;
    }
    const displacement = createDisplacementMap(width, height, lensCorrection);
    const canvas = document.createElement("canvas");
    canvas.width = displacement.width;
    canvas.height = displacement.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.putImageData(
      new ImageData(displacement.data, displacement.width, displacement.height),
      0,
      0,
    );
    setMap({ href: canvas.toDataURL("image/png"), scale: displacement.scale });
  }, [lensCorrection, width, height]);

  if (map === null) {
    return null;
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="0"
      height="0"
      className="absolute pointer-events-none"
      aria-hidden="true"
    >
      <filter
        id={lensCorrectionFilterId}
        filterUnits="userSpaceOnUse"
        primitiveUnits="userSpaceOnUse"
        x="0"
        y="0"
        width={width}
        height={height}
        colorInterpolationFilters="sRGB"
      >
        <feImage
          href={map.href}
          x="0"
          y="0"
          width={width}
          height={height}
          preserveAspectRatio="none"
          result="map"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="map"
          scale={map.scale}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
