import { useContext } from "react";
import { createContext } from "react";
import { Layer } from "@/_lib/interfaces/layer";

export interface RenderContextType {
  erosions: number;
  layers: Map<string, Layer>;
  setLayers: (layer: Map<string, Layer>) => void;
}

export const RenderContext = createContext<RenderContextType>({
  layers: new Map(),
  setLayers: () => {},
  erosions: 0,
});


export default function useRenderContext() {
  return useContext(RenderContext);
}
