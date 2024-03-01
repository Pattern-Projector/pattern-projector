"use client";

import { createContext, Dispatch, SetStateAction } from "react";
import { Layer } from "@/_lib/layer";

export interface PDFLayerContextType {
  layers: Map<string, Layer>;
  setLayers: (layer: Map<string, Layer>) => void;
}

export default createContext<PDFLayerContextType>({
  layers: new Map(),
  setLayers: (layers) => {},
});
