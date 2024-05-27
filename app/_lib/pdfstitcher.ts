import {
  PDFDocument,
  PDFName,
  PDFRef,
  PDFPage,
  PDFPageLeaf,  
  PDFOperator,
  concatTransformationMatrix,
  pushGraphicsState,
  drawObject,
  popGraphicsState,
  PDFContentStream,
  PDFDict,
} from "@cantoo/pdf-lib";
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
  const width = pageSize.width - settings.edgeInsets.horizontal;
  const height = pageSize.height - settings.edgeInsets.vertical;

  return { width: width, height: height };
}

async function initNewDoc(inDoc: PDFDocument) {
  /**
   * Creates a copy of the input document, but removes all the pages.
   */
  const outDoc = await PDFDocument.load(await inDoc.save());
  while (outDoc.getPageCount() > 0) {
    outDoc.removePage(0);
  }

  return outDoc;
}

function getFormXObjectForPage(doc: PDFDocument, ref: PDFRef): PDFRef | undefined {
  /**
   * Create a form XObject from a page reference. Does not copy resources, just references them.
   * Adapted from https://github.com/qpdf/qpdf/blob/2eefa580aa0ecf70ae3864d5c47e728480055c38/libqpdf/QPDFPageObjectHelper.cc#L705
   */

  const page = doc.context.lookup(ref) as PDFPageLeaf | undefined;
  if (!page) return undefined;

  // Create a new form XObject
  const xObject = doc.context.obj({});
  xObject.set(PDFName.of("Type"), PDFName.of("XObject"));
  xObject.set(PDFName.of("Subtype"), PDFName.of("Form"));

  // Copy the contents, resources, and group info
  const toCopy = ["Group", "Resources", "Contents"].map((key) => PDFName.of(key));
  for (const key of toCopy) {
    const value = page.get(key);
    if (value) xObject.set(key, value);
  }
  
  // Bounding box is set by CropBox if it exists, otherwise MediaBox
  const bbox = page.get(PDFName.of("CropBox")) || page.get(PDFName.of("MediaBox"));
  if (bbox) xObject.set(PDFName.of("BBox"), bbox);
  
  // register the new form XObject and return the reference
  return doc.context.register(xObject);
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
    outHeight + margin * 2
  );

  // Loop through the pages and copy them to the output document
  let x = 0;
  let y = outHeight - pageSize.height;

  // define the commands to draw the page and the resources dictionary
  const commands: PDFOperator[] = [];
  const XObjectDict = outDoc.context.obj({});

  for (const p of pages) {
    if (p > 0) {
      // create a new form XObject for the page
      const xRef = await getFormXObjectForPage(outDoc, inDoc.getPage(p - 1).ref);
      if (!xRef) {
        throw new Error(`Failed to create form XObject for page ${p}`);
      }

      // Add commands to the content stream to draw the form
      commands.push(pushGraphicsState());
      commands.push(concatTransformationMatrix(1, 0, 0, 1, x, y));
      commands.push(drawObject(`page${p}`));
      commands.push(popGraphicsState());

      // Update the resources dictionary
      XObjectDict.set(PDFName.of(`page${p}`), xRef);
    }

    // Adjust the position for the next page
    x += pageSize.width;
    if (x > outWidth - margin) {
      x = 0;
      y -= pageSize.height;
    }
  }

  // Write the commands to the content stream  
  const dict = outDoc.context.obj({});
  const contentStream = PDFContentStream.of(dict, commands);
  outPage.node.set(PDFName.Contents, outDoc.context.register(contentStream));

  // Update the resources dictionary
  const resources = outPage.node.get(PDFName.of("Resources")) as PDFDict | undefined;
  if (resources) {
    resources.set(PDFName.of("XObject"), XObjectDict);
  } else {
    outPage.node.set(PDFName.of("Resources"), outDoc.context.obj({XObject: XObjectDict}));
  }

  // Save the stitched document
  return await outDoc.save();
}
