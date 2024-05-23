import {
  PDFDocument,
  PDFName,
  PDFObjectCopier,
  PDFObject,
} from "@cantoo/pdf-lib";
import { StitchSettings } from "@/_lib/interfaces/stitch-settings";
import { getPageNumbers } from "./get-page-numbers";

function trimmedPageSize(
  inDoc: PDFDocument,
  pages: number[],
  settings: StitchSettings,
) {
  /**
   * Computes the size for each trimmed page.
   * Assumes that all selected pages are the same!
   */
  const firstRealPage = (pages.find((p) => p > 0) || 1) - 1;
  const firstPage = inDoc.getPage(firstRealPage);

  const pageSize = firstPage.getTrimBox() || firstPage.getMediaBox();
  const width = pageSize.width - settings.edgeInsets.horizontal;
  const height = pageSize.height - settings.edgeInsets.vertical;

  return { width: width, height: height };
}

async function initNewDoc(inDoc: PDFDocument) {
  /**
   * Creates a new document, copying over metadata and various other
   * properties (especially layer info)
   */
  const outDoc = await PDFDocument.create();
  const copier = PDFObjectCopier.for(inDoc.context, outDoc.context);
  const pagesKey = PDFName.of("Pages");
  for (const [key, value] of inDoc.catalog.entries()) {
    if (key != pagesKey) {
      outDoc.catalog.set(key, copier.copy(value));
    }
  }

  return outDoc;
}

export async function saveStitchedPDF(
  file: File,
  settings: StitchSettings,
  pageCount: number,
  password: string = "",
) {
  // Grab the bytes from the file object and try to load the PDF
  // Error handling is done in the calling function.
  const pdfBytes = await file.arrayBuffer();
  const inDoc = await PDFDocument.load(pdfBytes, {
    ignoreEncryption: true,
    password,
  });

  const outDoc = await initNewDoc(inDoc);

  // Trust that the user is happy with the layout
  const pages = getPageNumbers(settings.pageRange, pageCount);
  const cols = settings.columnCount;
  const rows = Math.ceil(pages.length / cols);
  const trim = settings.edgeInsets;

  // Compute the size of the output document
  const pageSize = trimmedPageSize(inDoc, pages, settings);
  const outWidth = pageSize.width * cols;
  const outHeight = pageSize.height * rows;

  // Create a new page to hold the stitched pages
  // Add at least a 1" margin because of weirdness.
  const margin = Math.max(trim.horizontal, trim.vertical, 72);
  const outPage = outDoc.addPage();
  outPage.setMediaBox(
    -margin,
    -margin,
    outWidth + margin * 2,
    outHeight + margin * 2,
  );

  // Loop through the pages and copy them to the output document
  let x = 0;
  let y = outHeight - pageSize.height;

  for (const p of pages) {
    if (p > 0) {
      const xobject = await outDoc.embedPage(inDoc.getPage(p - 1));
      outPage.drawPage(xobject, { x: x, y: y });
    }
    // Adjust the position for the next page
    x += pageSize.width;
    if (x > outWidth - margin) {
      x = 0;
      y -= pageSize.height;
    }
  }

  // Save the stitched document
  return await outDoc.save();
}
