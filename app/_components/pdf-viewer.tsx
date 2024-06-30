import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useReducer,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";

import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import CustomRenderer from "@/_components/pdf-custom-renderer";
import { getPageNumbers } from "@/_lib/get-page-numbers";
import { PDF_TO_CSS_UNITS } from "@/_lib/pixels-per-inch";
import { RenderContext } from "@/_hooks/use-render-context";
import { StitchSettings } from "@/_lib/interfaces/stitch-settings";
import { StitchSettingsAction } from "@/_reducers/stitchSettingsReducer";
import { getLayersFromPdf, Layers } from "@/_lib/layers";
import { LoadStatusEnum } from "@/_lib/load-status-enum";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url,
).toString();

export default function PdfViewer({
  file,
  layers,
  setLayers,
  setPageCount,
  setLayoutWidth,
  setLayoutHeight,
  dispatchStitchSettings,
  pageCount,
  lineThickness,
  stitchSettings,
  filter,
  setPdfLoadStatus,
  setLineThicknessStatus,
}: {
  file: any;
  layers: Layers;
  setLayers: (layers: Layers) => void;
  setPageCount: Dispatch<SetStateAction<number>>;
  setLayoutWidth: Dispatch<SetStateAction<number>>;
  setLayoutHeight: Dispatch<SetStateAction<number>>;
  dispatchStitchSettings: Dispatch<StitchSettingsAction>;
  pageCount: number;
  lineThickness: number;
  stitchSettings: StitchSettings;
  filter: string;
  setPdfLoadStatus: Dispatch<SetStateAction<LoadStatusEnum>>;
  setLineThicknessStatus: Dispatch<SetStateAction<LoadStatusEnum>>;
}) {
  const [pageSizes, setPageSize] = useReducer(
    pageSizeReducer,
    new Map<number, { width: number; height: number }>(),
  );

  function onDocumentLoadSuccess(docProxy: PDFDocumentProxy) {
    const numPages = docProxy.numPages;
    setPageCount(numPages);
    setPageSize({ action: "clear" });
    if (stitchSettings.pageRange.endsWith("-") && numPages > 0) {
      dispatchStitchSettings({
        type: "set-page-range",
        pageRange: stitchSettings.pageRange + numPages,
      });
    }
    getLayersFromPdf(docProxy).then((l) => setLayers(l));
  }

  function onPageLoadSuccess(pdfProxy: PDFPageProxy) {
    const scale = (pdfProxy.userUnit || 1) * PDF_TO_CSS_UNITS;
    setPageSize({
      action: "setPage",
      pageNumber: pdfProxy.pageNumber,
      width: pdfProxy.view[2] * scale,
      height: pdfProxy.view[3] * scale,
    });
  }

  function onPageRenderSuccess() {
    setPdfLoadStatus(LoadStatusEnum.SUCCESS);
    setLineThicknessStatus(LoadStatusEnum.SUCCESS);
  }

  const customTextRenderer = useCallback(({ str }: { str: string }) => {
    return `<span class="opacity-0 hover:opacity-100 hover:text-6xl" style="background-color: #FFF; color: #000;">${str}</span>`;
  }, []);

  useEffect(() => {
    const pages = getPageNumbers(stitchSettings.pageRange, pageCount);
    const itemCount = pages.length;
    const columns = Math.max(
      Math.min(stitchSettings.columnCount, itemCount),
      1,
    );
    const rowCount = Math.ceil((itemCount || 1) / columns);
    const [tileWidth, tileHeight] = getTileSize(pages, pageSizes);
    const w =
      tileWidth * columns -
      (columns - 1) * PDF_TO_CSS_UNITS * stitchSettings.edgeInsets.horizontal;
    const h =
      tileHeight * rowCount -
      (rowCount - 1) * PDF_TO_CSS_UNITS * stitchSettings.edgeInsets.vertical;
    setLayoutWidth(w);
    setLayoutHeight(h);
  }, [pageSizes, stitchSettings, setLayoutWidth, setLayoutHeight, pageCount]);

  const pages = getPageNumbers(stitchSettings.pageRange, pageCount);
  const keys = getKeys(pages);
  const [tileWidth, tileHeight] = getTileSize(pages, pageSizes);
  const cssEdgeInsets = {
    vertical: stitchSettings.edgeInsets.vertical * PDF_TO_CSS_UNITS,
    horizontal: stitchSettings.edgeInsets.horizontal * PDF_TO_CSS_UNITS,
  };
  const insetWidth = `${tileWidth - cssEdgeInsets.horizontal}px`;
  const insetHeight = `${tileHeight - cssEdgeInsets.vertical}px`;

  return (
    <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${stitchSettings.columnCount}, max-content)`,
          marginRight: cssEdgeInsets.horizontal,
          marginBottom: cssEdgeInsets.vertical,
          filter: filter,
        }}
      >
        {pages.map((value, index) => {
          return (
            <div
              key={keys[index]}
              style={{
                width: insetWidth,
                height: insetHeight,
                mixBlendMode:
                  cssEdgeInsets.horizontal == 0 && cssEdgeInsets.vertical == 0
                    ? "normal"
                    : "darken",
              }}
            >
              {value != 0 && (
                <RenderContext.Provider
                  value={{
                    erosions: lineThickness,
                    layers,
                    onPageRenderSuccess,
                  }}
                >
                  <Page
                    scale={PDF_TO_CSS_UNITS}
                    pageNumber={value}
                    renderMode="custom"
                    customRenderer={CustomRenderer}
                    customTextRenderer={customTextRenderer}
                    renderTextLayer={true}
                    canvasBackground="#ccc"
                    onLoadSuccess={onPageLoadSuccess}
                  />
                </RenderContext.Provider>
              )}
            </div>
          );
        })}
      </div>
    </Document>
  );
}

function getKeys(pages: number[]): string[] {
  const keys: string[] = [];
  const values = new Map<number, number>();
  for (const value of pages) {
    const seen = values.get(value) ?? 0;
    keys.push(`${value}_${seen}`);
    values.set(value, seen + 1);
  }
  return keys;
}

function pageSizeReducer(
  state: Map<number, { width: number; height: number }>,
  action:
    | { action: "clear" }
    | { action: "setPage"; pageNumber: number; width: number; height: number },
) {
  if (action.action === "clear") {
    return new Map();
  }
  const { pageNumber, width, height } = action;
  const newState = new Map(state);
  newState.set(pageNumber, { width, height });
  return newState;
}

function getTileSize(
  pages: number[],
  pageSizes: Map<number, { width: number; height: number }>,
): [number, number] {
  let tileWidth = 0;
  let tileHeight = 0;
  for (const page of pages) {
    tileWidth = Math.max(tileWidth, pageSizes.get(page)?.width ?? 0);
    tileHeight = Math.max(tileHeight, pageSizes.get(page)?.height ?? 0);
  }
  return [tileWidth, tileHeight];
}
