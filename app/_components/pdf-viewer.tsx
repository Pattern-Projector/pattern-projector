import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import { Matrix } from "ml-matrix";
import { CSSProperties, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import type { PDFDocumentProxy } from "pdfjs-dist";
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

export default function PdfViewer({
  file,
  style,
}: {
  file: File | null;
  style: CSSProperties;
}) {
  const [numPages, setNumPages] = useState<number>();

  function onDocumentLoadSuccess({
    numPages: nextNumPages,
  }: PDFDocumentProxy): void {
    setNumPages(nextNumPages);
  }

  return (
    <>
      <div className="absolute z-0" style={style}>
        <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
          {Array.from(new Array(numPages), (el, index) => (
            <Page key={`page_${index + 1}`} pageNumber={index + 1} /> //seems to fix sizing issue.
          ))}
        </Document>
      </div>
    </>
  );
}
