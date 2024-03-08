import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import { Dispatch, SetStateAction, useCallback } from "react";
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
  setPageNumber,
  setPageWidth,
  setPageHeight,
  pageCount,
  pageNumber,
  layers,
  setLocalTransform,
  calibrationTransform,
  columnCount,
  edgeInsets,
  pageRange,
  pageWidth,
  pageHeight,
}: {
  file: any;
  setLayers: Dispatch<SetStateAction<Map<string, Layer>>>;
  setPageCount: Dispatch<SetStateAction<number>>;
  setPageNumber: Dispatch<SetStateAction<number>>;
  setPageWidth: Dispatch<SetStateAction<number>>;
  setPageHeight: Dispatch<SetStateAction<number>>;
  pageCount: number;
  pageNumber: number;
  layers: Map<string, Layer>;
  setLocalTransform: Dispatch<SetStateAction<Matrix>>;
  calibrationTransform: Matrix;
  columnCount: string;
  edgeInsets: EdgeInsets;
  pageRange: string;
  pageWidth: number;
  pageHeight: number;
}) {
  function onDocumentLoadSuccess(docProxy: PDFDocumentProxy) {
    setPageCount(docProxy.numPages);
    setPageNumber(1);
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

  return (
    <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columnCount}, max-content)`,
        }}
      >
        {getPageNumbers(pageRange, pageCount).map((value, index) => {
          return value == 0 ? (
            <div key={index}></div>
          ) : (
            <div
              style={{
                width:
                  String(
                    pageWidth -
                      Number(edgeInsets.left) -
                      Number(edgeInsets.right),
                  ) + "pt",
                height:
                  String(
                    pageHeight -
                      Number(edgeInsets.top) -
                      Number(edgeInsets.bottom),
                  ) + "pt",
              }}
            >
              <Page
                key={`page_${value}`}
                pageNumber={value}
                renderMode="custom"
                customRenderer={customRenderer}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                onLoadSuccess={onPageLoadSuccess}
              />
            </div>
          );
        })}
      </div>
    </Document>
  );
}
