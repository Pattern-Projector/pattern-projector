import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import { Dispatch, SetStateAction, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import CustomRenderer from "@/_components/pdf-custom-renderer";
import { Layer } from "@/_lib/layer";
import Matrix from "ml-matrix";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
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
  pageNumber,
  layers,
  setLocalTransform,
  calibrationTransform,
  setGridOn,
}: {
  file: any;
  setLayers: Dispatch<SetStateAction<Map<string, Layer>>>;
  setPageCount: Dispatch<SetStateAction<number>>;
  setPageNumber: Dispatch<SetStateAction<number>>;
  setPageWidth: Dispatch<SetStateAction<number>>;
  setPageHeight: Dispatch<SetStateAction<number>>;
  pageNumber: number;
  layers: Map<string, Layer>;
  setLocalTransform: Dispatch<SetStateAction<Matrix>>;
  calibrationTransform: Matrix;
  setGridOn: Dispatch<SetStateAction<boolean>>;
}) {
  function onDocumentLoadSuccess(docProxy: PDFDocumentProxy) {
    setPageCount(docProxy.numPages);
    setPageNumber(1);
    setLayers(new Map());
    // reset local transform
    setLocalTransform(calibrationTransform);
    // Hide grid to make it more obvious that you can cut outside of it.
    setGridOn(false);
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
      <Page
        pageNumber={pageNumber}
        renderMode="custom"
        customRenderer={customRenderer}
        renderAnnotationLayer={false}
        renderTextLayer={false}
        onLoadSuccess={onPageLoadSuccess}
      />
    </Document>
  );
}
