import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";

import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import CustomRenderer from "@/_components/pdf-custom-renderer";
import { Layer } from "@/_lib/layer";
import { EdgeInsets } from "@/_lib/edge-insets";
import { getPageNumbers } from "@/_lib/get-page-numbers";
import { PDF_TO_CSS_UNITS } from "@/_lib/pixels-per-inch";
import Matrix from "ml-matrix";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url,
).toString();

function erosionFilter(erosions: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg">
  <filter id="erode">
    <feMorphology operator="erode" radius="${erosions}" />
  </filter>
</svg>`;
  const url = `data:image/svg+xml;base64,${btoa(svg)}`;
  return `url(${url}#erode)`;
}

/**
 *
 * @param file - File to be opened by PdfViewer
 * @param pageNumber - Number of page to be displayed
 */
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

  const customRenderer = useCallback(
    () => CustomRenderer(setLayers, layers),
    [setLayers, layers],
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
        {getPageNumbers(pageRange, pageCount).map((value, index, array) => {
          return value == 0 ? (
            <div key={index}></div>
          ) : (
            <div
              key={`page_${index}_${value}`}
              style={{
                width: `${pageWidth - Number(edgeInsets.horizontal)}px`,
                height: `${pageHeight - Number(edgeInsets.vertical)}px`,
                mixBlendMode: "multiply",
                filter: erosionFilter(lineThickness),
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
                onLoadSuccess={onPageLoadSuccess}
              />
            </div>
          );
        })}
      </div>
    </Document>
  );
}
