import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";

import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import CustomRenderer from "@/_components/pdf-custom-renderer";
import { Layer } from "@/_lib/interfaces/layer";
import { EdgeInsets } from "@/_lib/interfaces/edge-insets";
import { getPageNumbers } from "@/_lib/get-page-numbers";
import { PDF_TO_CSS_UNITS } from "@/_lib/pixels-per-inch";
import Matrix from "ml-matrix";
import { erosionFilter } from "@/_lib/erode";

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
  setLocalTransform,
  pageCount,
  layers,
  lineThickness,
  columnCount,
  edgeInsets,
  pageRange,
  filter,
}: {
  file: any;
  setLayers: Dispatch<SetStateAction<Map<string, Layer>>>;
  setPageCount: Dispatch<SetStateAction<number>>;
  setLayoutWidth: Dispatch<SetStateAction<number>>;
  setLayoutHeight: Dispatch<SetStateAction<number>>;
  setLocalTransform: Dispatch<SetStateAction<Matrix>>;
  pageCount: number;
  layers: Map<string, Layer>;
  lineThickness: number;
  columnCount: string;
  edgeInsets: EdgeInsets;
  pageRange: string;
  filter: string;
}) {
  const [pageSizes, setPageSize] = useReducer(
    pageSizeReducer,
    new Map<number, { width: number; height: number }>(),
  );

  function onDocumentLoadSuccess(docProxy: PDFDocumentProxy) {
    setPageCount(docProxy.numPages);
    setLayers(new Map());
    setLocalTransform(Matrix.identity(3));
    setPageSize({ action: "clear" });
  }

  const isSafari = useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.indexOf("safari") != -1 && ua.indexOf("chrome") == -1;
  }, []);

  const isFirefox = useMemo(() => {
    return navigator.userAgent.toLowerCase().includes("firefox");
  }, []);

  // Firefox and Safari do not support the feMorphology filter in CSS.
  const renderErosions = isSafari || isFirefox ? lineThickness : 0;

  function onPageLoadSuccess(pdfProxy: PDFPageProxy) {
    const scale = (pdfProxy.userUnit || 1) * PDF_TO_CSS_UNITS;
    setPageSize({
      action: "setPage",
      pageNumber: pdfProxy.pageNumber,
      width: pdfProxy.view[2] * scale,
      height: pdfProxy.view[3] * scale,
    });
  }

  const customRenderer = useCallback(
    () => CustomRenderer(setLayers, layers, renderErosions),
    [setLayers, layers, renderErosions],
  );

  const customTextRenderer = useCallback(({ str }: { str: string }) => {
    return `<span class="opacity-0 hover:opacity-100 hover:text-6xl" style="background-color: #FFF; color: #000;">${str}</span>`;
  }, []);

  useEffect(() => {
    const pages = getPageNumbers(pageRange, pageCount);
    const itemCount = pages.length;
    const columns = Math.max(Math.min(Number(columnCount), itemCount), 1);
    const rowCount = Math.ceil((itemCount || 1) / columns);
    const [tileWidth, tileHeight] = getTileSize(pages, pageSizes);
    const w =
      tileWidth * columns -
      (columns - 1) * PDF_TO_CSS_UNITS * Number(edgeInsets.horizontal);
    const h =
      tileHeight * rowCount -
      (rowCount - 1) * PDF_TO_CSS_UNITS * Number(edgeInsets.vertical);
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
  ]);

  const pages = getPageNumbers(pageRange, pageCount);
  const keys = getKeys(pages);
  const [tileWidth, tileHeight] = getTileSize(pages, pageSizes);
  const cssEdgeInsets = {
    vertical: Number(edgeInsets.vertical) * PDF_TO_CSS_UNITS,
    horizontal: Number(edgeInsets.horizontal) * PDF_TO_CSS_UNITS,
  };
  const insetWidth = `${tileWidth - cssEdgeInsets.horizontal}px`;
  const insetHeight = `${tileHeight - cssEdgeInsets.vertical}px`;

  return (
    <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columnCount}, max-content)`,
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
                filter:
                  isFirefox || isSafari ? "none" : erosionFilter(lineThickness),
                mixBlendMode:
                  cssEdgeInsets.horizontal == 0 && cssEdgeInsets.vertical == 0
                    ? "normal"
                    : "darken",
              }}
            >
              {value != 0 && (
                <Page
                  scale={PDF_TO_CSS_UNITS}
                  pageNumber={value}
                  renderMode="custom"
                  customRenderer={customRenderer}
                  customTextRenderer={customTextRenderer}
                  renderTextLayer={true}
                  canvasBackground="#ccc"
                  onLoadSuccess={onPageLoadSuccess}
                />
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
