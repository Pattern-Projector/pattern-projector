import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Size } from "@/_lib/size";

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
  setLayoutSize,
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
  setLayoutSize: Dispatch<SetStateAction<Size>>;
  pageCount: number;
  layers: Map<string, Layer>;
  onDocumentLoad: (newSize: Size) => void;
  lineThickness: number;
  columnCount: string;
  edgeInsets: EdgeInsets;
  pageRange: string;
}) {
  const [pageSize, setPageSize] = useState<Size>({width:0, height:0});
  const pageCountRef = useRef<number | null>(null);
  const pageSizeRef = useRef<Size | null>(null);

  function onDocumentLoadSuccess(docProxy: PDFDocumentProxy) {
    const newPageCount = docProxy.numPages;
    setPageCount(newPageCount);
    pageCountRef.current = newPageCount 
    setLayers(new Map());
  }

  function onPageLoadSuccess(pdfProxy: PDFPageProxy) {
    const newPageSize = {
      width: pdfProxy.view[2] * (pdfProxy.userUnit || 1),
      height: pdfProxy.view[3] * (pdfProxy.userUnit || 1),
    }
    setPageSize(newPageSize)
    pageSizeRef.current = newPageSize;
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
    const newSize = {
      width: pageSize.width * Number(columnCount) -
        Number(edgeInsets.horizontal) * Number(columnCount),
      height: pageSize.height * rowCount - Number(edgeInsets.vertical) * rowCount,
    }
    setLayoutSize(newSize);

    /* Only call onDocumentLoad once the layoutSize has
     * finished updating, use references to get latest values */
    if( pageCountRef.current !== null &&
        pageSizeRef.current !== null
    ){
      const pageRange = `1-${pageCount}`;
      const itemCount = getPageNumbers(pageRange, pageCountRef.current).length;
      const rowCount = Math.ceil(itemCount / (pageCountRef.current || 1));
      const newSize = {
        width: pageSizeRef.current.width * pageCountRef.current -
          Number(edgeInsets.horizontal) * pageCountRef.current,
        height: pageSizeRef.current.height * rowCount - Number(edgeInsets.vertical) * rowCount,
      }
      pageCountRef.current = null;
      pageSizeRef.current = null;
      onDocumentLoad(newSize);
    }
  }, [
    pageSize,
    pageRange,
    columnCount,
    pageCount,
    setLayoutSize,
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
                width: `${pageSize.width - Number(edgeInsets.horizontal)}pt`,
                height: `${pageSize.height - Number(edgeInsets.vertical)}pt`,
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
