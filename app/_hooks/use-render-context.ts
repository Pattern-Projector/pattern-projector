import { useContext } from "react";
import { createContext } from "react";
import { Layers } from "@/_lib/layers";

export interface RenderContextType {
  erosions: number;
  layers: Layers;
  onPageRenderSuccess: () => void;
}

export const RenderContext = createContext<RenderContextType>({
  erosions: 0,
  layers: {},
  onPageRenderSuccess: () => {},
});

export default function useRenderContext() {
  return useContext(RenderContext);
}
