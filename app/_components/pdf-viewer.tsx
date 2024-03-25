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
import Matrix from "ml-matrix";
import { EdgeInsets } from "@/_lib/edge-insets";
import { getPageNumbers } from "@/_lib/get-page-numbers";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url,
).toString();

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
  pageCount,
  layers,
  onDocumentLoad,
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
  pageCount: number;
  layers: Map<string, Layer>;
  onDocumentLoad: () => void;
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
    /* Call document load callback */
    onDocumentLoad();
  }

  function onPageLoadSuccess(pdfProxy: PDFPageProxy) {
    setPageWidth(pdfProxy.view[2] * (pdfProxy.userUnit || 1));
    setPageHeight(pdfProxy.view[3] * (pdfProxy.userUnit || 1));
  }

  const customRenderer = useCallback(
    () => CustomRenderer(setLayers, layers, lineThickness),
    [setLayers, layers, lineThickness],
  );

  const customTextRenderer = useCallback(({ str }: { str: string }) => {
    return `<span class="opacity-0 hover:opacity-100 hover:text-6xl" style="background-color: #FFF; color: #000;">${str}</span>`;
  }, []);

  const CSS = 96.0;
  const PDF = 72.0;
  const PDF_TO_CSS_UNITS = CSS / PDF;

  useEffect(() => {
    const itemCount = getPageNumbers(pageRange, pageCount).length;
    const rowCount = Math.ceil(itemCount / (Number(columnCount) || 1));
    setLayoutWidth(
      pageWidth * Number(columnCount) -
        Number(edgeInsets.horizontal) * Number(columnCount),
    );
    setLayoutHeight(
      pageHeight * rowCount - Number(edgeInsets.vertical) * rowCount,
    );
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
        }}
      >
        {getPageNumbers(pageRange, pageCount).map((value, index, array) => {
          return value == 0 ? (
            <div key={index}></div>
          ) : (
            <div
              key={`page_${index}_${value}`}
              style={{
                width: `${pageWidth - Number(edgeInsets.horizontal)}pt`,
                height: `${pageHeight - Number(edgeInsets.vertical)}pt`,
                mixBlendMode: "multiply",
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
