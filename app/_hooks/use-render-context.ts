import { useContext } from "react";
import { createContext } from "react";
import { Layers } from "@/_lib/layers";

export interface RenderContextType {
  erosions: number;
  layers: Layers;
  magnifying: boolean;
  onPageRenderSuccess: () => void;
  patternScale: number;
}

export const RenderContext = createContext<RenderContextType>({
  erosions: 0,
  layers: {},
  magnifying: false,
  onPageRenderSuccess: () => {},
  patternScale: 1,
});

export default function useRenderContext() {
  return useContext(RenderContext);
}
