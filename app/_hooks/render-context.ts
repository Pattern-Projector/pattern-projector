"use client";

import { createContext } from "react";
import { Layer } from "@/_lib/interfaces/layer";

export interface RenderContextType {
  erosions: number;
  layers: Map<string, Layer>;
  setLayers: (layer: Map<string, Layer>) => void;
}

export default createContext<RenderContextType>({
  layers: new Map(),
  setLayers: () => {},
  erosions: 0,
});
