import invariant from "tiny-invariant";
import { usePageContext, useDocumentContext } from "react-pdf";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api.js";
import { Layer } from "@/_lib/interfaces/layer";
import { PDFPageProxy, PageViewport } from "pdfjs-dist";
import { PDF_TO_CSS_UNITS } from "@/_lib/pixels-per-inch";
import useRenderContext from "@/_hooks/use-render-context";
import PageTileRenderer from "./page-tile-renderer";
import { useMemo } from "react";

async function optionalContentConfigPromise(
  pdf: PDFDocumentProxy,
  layers: Map<string, Layer>,
  setLayers: (layer: Map<string, Layer>) => void,
) {
  const optionalContentConfig = await pdf.getOptionalContentConfig();
  const groups = optionalContentConfig.getGroups();
  if (groups) {
    if (layers.size === 0) {
      const l = new Map<string, Layer>();
      Object.keys(groups).forEach((key) => {
        const name = String(groups[key].name) ?? key;
        const existing = l.get(name);
        if (existing) {
          existing.ids.push(key);
          l.set(name, existing);
        } else {
          l.set(name, {
            name,
            ids: [key],
            visible: true,
          });
        }
        setLayers(l);
      });
    } else {
      for (const entry of layers) {
        const layer = entry[1];
        for (let i = 0; i < layer.ids.length; i += 1) {
          optionalContentConfig.setVisibility(layer.ids[i], layer.visible);
        }
      }
    }
  }
  return optionalContentConfig;
}

export default function CustomRenderer() {
  const { layers, setLayers } = useRenderContext();
  const pageContext = usePageContext();

  invariant(pageContext, "Unable to find Page context.");

  const docContext = useDocumentContext();

  invariant(docContext, "Unable to find Document context.");

  const page = pageContext.page;
  const pdf = docContext.pdf;
  const userUnit = (page as PDFPageProxy).userUnit || 1;

  invariant(page, "Unable to find page.");
  invariant(pdf, "Unable to find pdf.");

  const cssPixels = userUnit * PDF_TO_CSS_UNITS;
  const dpr = 0.5; //1; // High DPI is too expensive for large documents
  const renderScale = cssPixels * dpr;
  const renderViewport = page.getViewport({
    scale: renderScale,
  });
  page.cleanup();

  const promise = useMemo(() => {
    return optionalContentConfigPromise(pdf, layers, setLayers);
  }, [pdf, layers, setLayers]);
  const tiles = getTiles(renderViewport, renderScale);
  page.view;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `max-content`,
      }}
    >
      {tiles.map((tile, index) => {
        return (
          <div key={index}>
            <PageTileRenderer
              optionalContentConfigPromise={promise}
              renderScale={renderScale}
              canvasWidth={tile.width * renderScale}
              canvasHeight={tile.height * renderScale}
              cssWidth={tile.width * cssPixels}
              cssHeight={tile.height * cssPixels}
              tx={-tile.x * renderScale}
              ty={-tile.y * renderScale}
            />
          </div>
        );
      })}
    </div>
  );
}

function getTiles(
  viewport: PageViewport,
  renderScale: number,
): { x: number; y: number; width: number; height: number }[] {
  const maxArea = 16777216; // Maximum canvas area supported by all browsers
  const rowCount = Math.ceil((viewport.width * viewport.height) / maxArea);
  const span = Math.ceil(viewport.height / rowCount);
  const tiles = [];
  for (let i = 0; i < rowCount; i++) {
    const y = i * span;
    const height = Math.min(span, viewport.height - y);
    tiles.push({
      x: 0,
      y: y / renderScale,
      width: viewport.width / renderScale,
      height: height / renderScale,
    });
  }
  return tiles;
}
