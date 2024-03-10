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
  pageNumber,
  layers,
  setLocalTransform,
  calibrationTransform,
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

  const customTextRenderer = useCallback(
    ({
      str,
      itemIndex,
      transform,
    }: {
      str: string;
      itemIndex: number;
      transform: Array<any>;
    }) => {
      return `<span class="opacity-0 hover:opacity-100" style="background-color: #FFF; color: #000; font-size: 60px; letter-spacing: 5px">${str}</span>`;
    },
    [],
  );

  const CSS = 96.0;
  const PDF = 72.0;
  const PDF_TO_CSS_UNITS = CSS / PDF;

  return (
    <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
      <Page
        scale={PDF_TO_CSS_UNITS}
        pageNumber={pageNumber}
        renderMode="custom"
        customRenderer={customRenderer}
        customTextRenderer={customTextRenderer}
        renderAnnotationLayer={false}
        renderTextLayer={true}
        onLoadSuccess={onPageLoadSuccess}
      />
    </Document>
  );
}
