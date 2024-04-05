import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
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
  const [pageWidth, setPageWidth] = useState<number>(0);
  const [pageHeight, setPageHeight] = useState<number>(0);
  function onDocumentLoadSuccess(docProxy: PDFDocumentProxy) {
    setPageCount(docProxy.numPages);
    setLayers(new Map());
    setLocalTransform(Matrix.identity(3));
  }

  function onPageLoadSuccess(pdfProxy: PDFPageProxy) {
    setPageWidth(
      PDF_TO_CSS_UNITS * pdfProxy.view[2] * (pdfProxy.userUnit || 1),
    );
    setPageHeight(
      PDF_TO_CSS_UNITS * pdfProxy.view[3] * (pdfProxy.userUnit || 1),
    );
  }

  const isSafari = useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.indexOf("safari") != -1 && ua.indexOf("chrome") == -1;
  }, []);

  const isFirefox = useMemo(() => {
    return navigator.userAgent.toLowerCase().includes("firefox");
  }, []);

  const customRenderer = useCallback(
    // Safari does not support filters on canvas so the erosions must be done in the renderer
    // Firefox runs very slowly with the filters so the erosions must be done in the renderer
    () =>
      CustomRenderer(
        setLayers,
        layers,
        isSafari || isFirefox ? lineThickness : 0,
      ),
    [setLayers, layers, isSafari, isFirefox, lineThickness],
  );

  const customTextRenderer = useCallback(({ str }: { str: string }) => {
    return `<span class="opacity-0 hover:opacity-100 hover:text-6xl" style="background-color: #FFF; color: #000;">${str}</span>`;
  }, []);

  useEffect(() => {
    const itemCount = getPageNumbers(pageRange, pageCount).length;
    const columns = Math.max(Math.min(Number(columnCount), itemCount), 1);
    const rowCount = Math.ceil((itemCount || 1) / columns);
    const w =
      pageWidth * columns - (columns - 1) * Number(edgeInsets.horizontal);
    const h =
      pageHeight * rowCount - (rowCount - 1) * Number(edgeInsets.vertical);
    setLayoutWidth(w);
    setLayoutHeight(h);
  }, [
    pageWidth,
    pageHeight,
    pageRange,
    columnCount,
    pageCount,
    setLayoutWidth,
    setLayoutHeight,
    edgeInsets,
  ]);

  return (
    <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columnCount}, max-content)`,
          marginRight: `${edgeInsets.horizontal}px`,
          marginBottom: `${edgeInsets.vertical}px`,
        }}
      >
        {getPageNumbers(pageRange, pageCount).map((value, index) => {
          return value == 0 ? (
            <div
              key={index}
              style={{
                width: `${pageWidth - Number(edgeInsets.horizontal)}px`,
                height: `${pageHeight - Number(edgeInsets.vertical)}px`,
              }}
            ></div>
          ) : (
            <div
              key={`page_${index}_${value}`}
              style={{
                filter:
                  isSafari || isFirefox ? "none" : erosionFilter(lineThickness),
                mixBlendMode:
                  Number(edgeInsets.horizontal) == 0 &&
                  Number(edgeInsets.vertical) == 0
                    ? "normal"
                    : "darken",
              }}
            >
              <div
                style={{
                  width: `${pageWidth - Number(edgeInsets.horizontal)}px`,
                  height: `${pageHeight - Number(edgeInsets.vertical)}px`,
                  filter: filter,
                }}
              >
                <Page
                  scale={PDF_TO_CSS_UNITS}
                  pageNumber={value}
                  renderMode="custom"
                  customRenderer={customRenderer}
                  customTextRenderer={customTextRenderer}
                  renderAnnotationLayer={false}
                  renderTextLayer={true}
                  canvasBackground="transparent"
                  onLoadSuccess={onPageLoadSuccess}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Document>
  );
}
