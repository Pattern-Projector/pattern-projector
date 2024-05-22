import { PDFDocument } from "@cantoo/pdf-lib";
import { StitchSettings } from "@/_lib/interfaces/stitch-settings";
import { getPageNumbers } from "./get-page-numbers";
import { PDF_TO_CSS_UNITS } from "@/_lib/pixels-per-inch";

export async function saveStitchedPDF(
  file: File,
  settings: StitchSettings,
  pageCount: number,
  password: string = ""
) {

  const pageRange = getPageNumbers(settings.pageRange, pageCount);

  // Grab the bytes from the file object and try to load the PDF
  const pdfBytes = await file.arrayBuffer();
  let inDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true, password });

  // Print out some info to make sure it's working
  console.log(inDoc.getPage(0).getTrimBox());

  const outDoc = PDFDocument.create();
}
