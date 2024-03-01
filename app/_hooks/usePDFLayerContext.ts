import { useContext } from "react";
import PDFLayerContext from "@/_hooks/PDFLayerContext";

export default function usePageContext() {
  return useContext(PDFLayerContext);
}
