import type { PDFDocumentProxy } from "pdfjs-dist";
import { Layer } from "./interfaces/layer";

export type Layers = { [key: string]: Layer };

export async function getLayersFromPdf(pdf: PDFDocumentProxy): Promise<Layers> {
  const layers: Layers = {};
  const groups: { [key: string]: { name: string } } = (
    await pdf.getOptionalContentConfig()
  ).getGroups();
  if (groups == null) {
    return layers;
  }
  Object.entries(groups).forEach(([key, group]) => {
    const name = String(group.name) ?? key;
    const existing = layers[name];
    if (existing != null) {
      existing.ids.push(key);
    } else {
      layers[name] = {
        name,
        ids: [key],
        visible: true,
      };
    }
  });
  return layers;
}
