import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import { Dispatch, SetStateAction, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import type { PDFDocumentProxy } from "pdfjs-dist";
import CustomRenderer from "@/_components/pdf-custom-renderer";
import { Layer } from "@/_lib/layer";
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
  pageNumber,
  layers,
}: {
  file: any;
  setLayers: Dispatch<SetStateAction<Map<string, Layer>>>;
  setPageCount: Dispatch<SetStateAction<number>>;
  setPageNumber: Dispatch<SetStateAction<number>>;
  pageNumber: number;
  layers: Map<string, Layer>;
}) {
  function onDocumentLoadSuccess(docProxy: PDFDocumentProxy) {
    setPageCount(docProxy.numPages);
    setPageNumber(1);
    setLayers(new Map());
  }

  return (
    <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
      <Page
        pageNumber={pageNumber}
        renderMode="custom"
        customRenderer={() => CustomRenderer(setLayers, layers)}
        renderAnnotationLayer={false}
        renderTextLayer={false}
      />
    </Document>
  );
}
