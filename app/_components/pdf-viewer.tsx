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
import { use } from "chai";

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
  setLocalTransform,
  calibrationTransform,
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
  setLocalTransform: Dispatch<SetStateAction<Matrix>>;
  calibrationTransform: Matrix;
  columnCount: string;
  edgeInsets: EdgeInsets;
  pageRange: string;
}) {
  const [pageWidth, setPageWidth] = useState<number>(0);
  const [pageHeight, setPageHeight] = useState<number>(0);

  function onDocumentLoadSuccess(docProxy: PDFDocumentProxy) {
    setPageCount(docProxy.numPages);
    setLayers(new Map());
    // reset local transform
    setLocalTransform(calibrationTransform);
  }

  function onPageLoadSuccess(pdfProxy: PDFPageProxy) {
    setPageWidth(pdfProxy.view[2]);
    setPageHeight(pdfProxy.view[3]);
  }

  const customRenderer = useCallback(
    () => CustomRenderer(setLayers, layers),
    [setLayers, layers],
  );

  const customTextRenderer = useCallback(({ str }: { str: string }) => {
    return `<span class="opacity-0 hover:opacity-100 hover:text-6xl" style="background-color: #FFF; color: #000;">${str}</span>`;
  }, []);

  const CSS = 96.0;
  const PDF = 72.0;
  const PDF_TO_CSS_UNITS = CSS / PDF;

  useEffect(() => {
    const itemCount = getPageNumbers(pageRange, pageCount).length;
    setLayoutWidth(pageWidth * Number(columnCount));
    setLayoutHeight(
      pageHeight * Math.ceil(itemCount / (Number(columnCount) || 1)),
    );
  }, [
    pageWidth,
    pageHeight,
    pageRange,
    columnCount,
    pageCount,
    setLayoutWidth,
    setLayoutHeight,
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
              style={{
                width: `${pageWidth - Number(edgeInsets.horizontal)}pt`,
                height: `${pageHeight - Number(edgeInsets.vertical)}pt`,
                mixBlendMode: "multiply",
              }}
            >
              <Page
                scale={PDF_TO_CSS_UNITS}
                key={`page_${value}`}
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
