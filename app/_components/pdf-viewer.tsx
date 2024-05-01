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
import { Layer } from "@/_lib/interfaces/layer";
import { EdgeInsets } from "@/_lib/interfaces/edge-insets";
import { getPageNumbers } from "@/_lib/get-page-numbers";
import { PDF_TO_CSS_UNITS } from "@/_lib/pixels-per-inch";
import { RenderContext } from "@/_hooks/use-render-context";
import { useTransformerContext } from "@/_hooks/use-transform-context";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url,
).toString();

export default function PdfViewer({
  file,
  setLayers,
  setPageCount,
  setLayoutWidth,
  setLayoutHeight,
  pageCount,
  layers,
  lineThickness,
  columnCount,
  edgeInsets,
  setEdgeInsets,
  pageRange,
  filter,
  scale,
  setScale,
}: {
  file: any;
  setLayers: Dispatch<SetStateAction<Map<string, Layer>>>;
  setPageCount: Dispatch<SetStateAction<number>>;
  setLayoutWidth: Dispatch<SetStateAction<number>>;
  setLayoutHeight: Dispatch<SetStateAction<number>>;
  pageCount: number;
  layers: Map<string, Layer>;
  lineThickness: number;
  columnCount: string;
  edgeInsets: EdgeInsets;
  setEdgeInsets: Dispatch<SetStateAction<EdgeInsets>>;
  pageRange: string;
  filter: string;
  scale: number;
  setScale: Dispatch<SetStateAction<number>>;
}) {
  const [pageSizes, setPageSize] = useReducer(
    pageSizeReducer,
    new Map<number, { width: number; height: number }>(),
  );
  const transformer = useTransformerContext();

  function onDocumentLoadSuccess(docProxy: PDFDocumentProxy) {
    setPageCount(docProxy.numPages);
    setLayers(new Map());
    setPageSize({ action: "clear" });
    setEdgeInsets({ vertical: "0", horizontal: "0" });
    setScale(1);
    transformer.reset();
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

  const customTextRenderer = useCallback(({ str }: { str: string }) => {
    return `<span class="opacity-0 hover:opacity-100 hover:text-6xl" style="background-color: #FFF; color: #000;">${str}</span>`;
  }, []);

  useEffect(() => {
    const [w, h] = getLayoutSize(
      pageSizes,
      pageRange,
      pageCount,
      columnCount,
      edgeInsets,
      scale,
    );
    setLayoutWidth(w);
    setLayoutHeight(h);
  }, [
    pageSizes,
    pageRange,
    columnCount,
    pageCount,
    setLayoutWidth,
    setLayoutHeight,
    edgeInsets,
    scale,
  ]);

  const pages = getPageNumbers(pageRange, pageCount);
  const keys = getKeys(pages);
  const [tileWidth, tileHeight] = getTileSize(pages, pageSizes, scale);
  const cssEdgeInsets = getCSSEdgeInsets(edgeInsets, scale);
  const insetWidth = `${tileWidth - Number(cssEdgeInsets.horizontal)}px`;
  const insetHeight = `${tileHeight - Number(cssEdgeInsets.vertical)}px`;

  return (
    <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columnCount}, max-content)`,
          paddingRight: cssEdgeInsets.horizontal + "px",
          paddingBottom: cssEdgeInsets.vertical + "px",
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
                  Number(cssEdgeInsets.horizontal) == 0 &&
                  Number(cssEdgeInsets.vertical) == 0
                    ? "normal"
                    : "darken",
              }}
            >
              {value != 0 && (
                <RenderContext.Provider
                  value={{ layers, setLayers, erosions: lineThickness, scale }}
                >
                  <Page
                    scale={PDF_TO_CSS_UNITS * scale}
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
  scale: number,
): [number, number] {
  let tileWidth = 0;
  let tileHeight = 0;
  for (const page of pages) {
    tileWidth = Math.max(tileWidth, pageSizes.get(page)?.width ?? 0);
    tileHeight = Math.max(tileHeight, pageSizes.get(page)?.height ?? 0);
  }
  return [tileWidth * scale, tileHeight * scale];
}

function getLayoutSize(
  pageSizes: Map<number, { width: number; height: number }>,
  pageRange: string,
  pageCount: number,
  columnCount: string,
  edgeInsets: EdgeInsets,
  scale: number,
): [number, number] {
  const pages = getPageNumbers(pageRange, pageCount);
  const [columns, rowCount] = getGridSize(pages, columnCount);
  const [tileWidth, tileHeight] = getTileSize(pages, pageSizes, scale);
  const insets = getCSSEdgeInsets(edgeInsets, scale);
  const w = tileWidth * columns - (columns - 1) * Number(insets.horizontal);
  const h = tileHeight * rowCount - (rowCount - 1) * Number(insets.vertical);
  return [w, h];
}

function getGridSize(pages: number[], columnCount: string): [number, number] {
  const itemCount = pages.length;
  const columns = Math.max(Math.min(Number(columnCount), itemCount), 1);
  const rows = Math.ceil((itemCount || 1) / columns);
  return [columns, rows];
}

function getCSSEdgeInsets(edgeInsets: EdgeInsets, scale: number): EdgeInsets {
  return {
    vertical: String(Number(edgeInsets.vertical) * PDF_TO_CSS_UNITS * scale),
    horizontal: String(
      Number(edgeInsets.horizontal) * PDF_TO_CSS_UNITS * scale,
    ),
  };
}
