import { useContext } from "react";
import RenderContext from "@/_hooks/render-context";

export default function useRenderContext() {
  return useContext(RenderContext);
}
