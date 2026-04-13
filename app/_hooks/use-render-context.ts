import { useContext } from "react";
import { createContext } from "react";
import { Layers } from "@/_lib/layers";

export interface RenderContextType {
  erosions: number;
  layers: Layers;
  magnifying: boolean;
  onPageRenderSuccess: () => void;
  patternScale: number;
  /**
   * When set, the recolor SVG filter maps black → this hex colour via a
   * feColorMatrix SVG filter.
   */
  recolourHex?: string;
  /**
   * CSS filter string for the active theme (e.g. "invert(1)" for Dark).
   * Applied to the container div on Chrome/Firefox; on Safari, where canvas
   * rendering is pixel-based, it is handled separately per platform.
   */
  themeFilter?: string;
}

export const RenderContext = createContext<RenderContextType>({
  erosions: 0,
  layers: {},
  magnifying: false,
  onPageRenderSuccess: () => {},
  patternScale: 1,
  recolourHex: undefined,
  themeFilter: undefined,
});

export default function useRenderContext() {
  return useContext(RenderContext);
}
