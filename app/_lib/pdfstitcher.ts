import { PDFDocument } from "@cantoo/pdf-lib";
import { StitchSettings } from "@/_lib/interfaces/stitch-settings";
import { getPageNumbers } from "./get-page-numbers";

function trimmedPageSize(
  inDoc: PDFDocument,
  pages: number[],
  settings: StitchSettings
) {
  /**
   * Computes the size for each trimmed page.
   * Assumes that all selected pages are the same!
   */
  const firstRealPage = (pages.find((p) => p > 0) || 1) - 1;
  const firstPage = inDoc.getPage(firstRealPage);

  const pageSize = firstPage.getTrimBox() || firstPage.getMediaBox();
  const width = pageSize.width - settings.edgeInsets.horizontal * 2;
  const height = pageSize.height - settings.edgeInsets.vertical * 2;

  return { width: width, height: height };
}

export async function saveStitchedPDF(
  file: File,
  settings: StitchSettings,
  pageCount: number,
  password: string = ""
) {
  // Grab the bytes from the file object and try to load the PDF
  // Error handling is done in the calling function.
  const pdfBytes = await file.arrayBuffer();
  let inDoc = await PDFDocument.load(pdfBytes, {
    ignoreEncryption: true,
    password,
  });

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
  const outDoc = await PDFDocument.create();
  const outPage = outDoc.addPage([outWidth, outHeight]);

  // Loop through the pages and copy them to the output document
  let x = 0;
  let y = outHeight - pageSize.height;
  for (const p of pages) {
    if (p > 0) {
      const xobject = await outDoc.embedPage(inDoc.getPage(p - 1), {
        left: trim.horizontal,
        bottom: trim.vertical,
        right: pageSize.width + trim.horizontal,
        top: pageSize.height + trim.vertical,
      });
      outPage.drawPage(xobject, {x: x, y: y});
    }
    // Adjust the position for the next page
    x += pageSize.width;
    if (x >= outWidth) {
      x = 0;
      y -= pageSize.height;
    }
  }

  // Save the stitched document
  return await outDoc.save()
}
