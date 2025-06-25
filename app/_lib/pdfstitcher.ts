import {
  PDFDocument,
  PDFName,
  PDFRef,
  PDFPageLeaf,
  PDFOperator,
  concatTransformationMatrix,
  pushGraphicsState,
  drawObject,
  popGraphicsState,
  PDFContentStream,
  PDFDict,
  PDFStream,
  PDFArray,
  PDFContext,
  PDFRawStream,
  decodePDFRawStream,
  UnrecognizedStreamTypeError,
} from "@cantoo/pdf-lib";
import {
  LineDirection,
  StitchSettings,
} from "@/_lib/interfaces/stitch-settings";
import { getPageNumbers, getRowsColumns } from "./get-page-numbers";
import { Layers } from "./layers";

function trimmedPageSize(
  inDoc: PDFDocument,
  pages: number[],
  settings: StitchSettings,
) {
  /**
   * Computes the size for each trimmed page.
   * Chooses the largest page width and height from the user specified page range to match how the pdf viewer works.
   */
  let width = 0;
  let height = 0;
  for (const page of pages) {
    // Filter out blank pages specified by a 0
    if (page > 0) {
      const p = inDoc.getPage(page - 1);
      const pageSize = p.getMediaBox();
      width = Math.max(width, pageSize.width - settings.edgeInsets.horizontal);
      height = Math.max(height, pageSize.height - settings.edgeInsets.vertical);
    }
  }

  return { width, height };
}

function initDoc(doc: PDFDocument, pages: number[]): Map<number, PDFRef> {
  /**
   * Creates a list of page numbers and references, then removes the pages from the document.
   */

  const pageMap = new Map<number, PDFRef>();
  for (const p of pages.filter((p) => p > 0)) {
    pageMap.set(p, doc.getPage(p - 1).ref);
  }

  // Remove all the pages
  while (doc.getPageCount() > 0) {
    doc.removePage(0);
  }

  return pageMap;
}

function mergeStreams(
  streams: PDFArray | PDFStream,
  context: PDFContext,
): PDFStream {
  /**
   * Content streams can be an array of streams or a single stream.
   * This function merges them into a single stream, or just returns
   * the stream if it was already a singleton.
   *
   * Note that the streams are first decoded, then joined with a newline,
   * then re-encoded, as concatenating encoded streams led to broken pdfs.
   * This results in an increase in file size, as the streams are copied.
   * Removing the original streams sometimes led to broken pdfs, so we
   * can't assume that they're never referenced elsewhere.
   *
   * Copied from the private function in pdf-lib here: https://github.com/cantoo-scribe/pdf-lib/blob/9593e75cbcf70f68dcf26bd541919e22514a5898/src/core/embedders/PDFPageEmbedder.ts#L118
   */
  if (streams instanceof PDFStream) return streams;
  else {
    let totalLength = 0;
    const decodedStreams: Uint8Array[] = [];
    for (const ref of streams.asArray()) {
      const stream = context.lookup(ref, PDFStream);
      let content: Uint8Array;
      if (stream instanceof PDFRawStream) {
        content = decodePDFRawStream(stream).decode();
      } else if (stream instanceof PDFContentStream) {
        content = stream.getUnencodedContents();
      } else {
        throw new UnrecognizedStreamTypeError(stream);
      }

      totalLength += content.length + 1; // +1 for newline
      decodedStreams.push(content);
    }

    const mergedStream = new Uint8Array(totalLength);
    let offset = 0;
    for (const content of decodedStreams) {
      mergedStream.set(content, offset);
      offset += content.length;
      mergedStream[offset] = 0x0a; // newline
      offset += 1;
    }

    return context.flateStream(mergedStream);
  }
}

function getFormXObjectForPage(
  context: PDFContext,
  ref: PDFRef,
): PDFRef | undefined {
  /**
   * Create a form XObject from a page reference. Does not copy resources, just references them.
   * Adapted from https://github.com/qpdf/qpdf/blob/2eefa580aa0ecf70ae3864d5c47e728480055c38/libqpdf/QPDFPageObjectHelper.cc#L705
   */

  const page = context.lookup(ref) as PDFPageLeaf | undefined;
  if (!page) return undefined;

  // PDF treats pages differently from forms, so we need to extract
  // the content stream and then add on the various attributes.
  let xObject = page.Contents();
  if (!xObject) return undefined;

  xObject = mergeStreams(xObject, context);
  xObject.dict.set(PDFName.of("Type"), PDFName.of("XObject"));
  xObject.dict.set(PDFName.of("Subtype"), PDFName.of("Form"));

  // Copy the contents, resources, and group info
  const toCopy = ["Group", "Resources"].map((key) => PDFName.of(key));
  for (const key of toCopy) {
    const value = page.get(key);
    if (value) xObject.dict.set(key, value);
  }

  // Bounding box is set by CropBox if it exists, otherwise MediaBox
  const bbox =
    page.get(PDFName.of("CropBox")) || page.get(PDFName.of("MediaBox"));
  if (bbox) xObject.dict.set(PDFName.of("BBox"), bbox);

  // register the new form XObject and return the reference
  return context.register(xObject);
}

function getAsDict(name: string, dict: PDFDict): PDFDict | undefined {
  /**
   * Helper function to get a dictionary from a parent dictionary.
   * If the object is a reference, find the actual dictionary.
   */
  const obj = dict.get(PDFName.of(name));
  if (obj instanceof PDFDict) return obj;
  if (obj instanceof PDFRef) return dict.context.lookup(obj, PDFDict);
  else return undefined;
}

function toggleLayers(doc: PDFDocument, layers: Layers) {
  /**
   * Toggle the default visibility of layers in the PDF based on user selections.
   * Note that this does not actually remove content the way PDFStitcher does.
   */
  const ocprops = getAsDict("OCProperties", doc.catalog);
  if (!ocprops) return; // sometimes the document doesn't have layers

  const D = getAsDict("D", ocprops) ?? doc.context.obj({});
  ocprops.set(PDFName.of("D"), D);

  const visible: PDFArray = doc.context.obj([]);
  const hidden: PDFArray = doc.context.obj([]);

  for (const layer of Object.values(layers)) {
    const refs = layer.ids.map((id) => PDFRef.of(parseInt(id)));
    refs.map((r) => (layer.visible ? visible.push(r) : hidden.push(r)));
  }

  D.set(PDFName.of("ON"), visible);
  D.set(PDFName.of("OFF"), hidden);
}

async function tilePages(doc: PDFDocument, settings: StitchSettings) {
  /**
   * Do the stitching stuff and update the document. Converts a multi-page document
   * into a single large page.
   */
  const pages = getPageNumbers(settings.pageRange, doc.getPageCount());
  const [rows, cols] = getRowsColumns(
    pages,
    settings.lineCount,
    settings.lineDirection,
  );
  const trim = settings.edgeInsets;

  // Compute the size of the output document
  const pageSize = trimmedPageSize(doc, pages, settings);
  const outWidth = pageSize.width * cols;
  const outHeight = pageSize.height * rows;

  // Modify the document to remove the pages but keep the objects
  const pageMap = initDoc(doc, pages);

  // Create a new page to hold the stitched pages
  // Add at least a 1" margin because of weirdness.
  const margin = Math.max(trim.horizontal, trim.vertical, 72);
  const outPage = doc.addPage();
  outPage.setMediaBox(
    -margin,
    -margin,
    outWidth + margin * 2,
    outHeight + margin * 2,
  );

  // Loop through the pages and copy them to the output document
  let x = 0;
  let y = outHeight - pageSize.height;

  // define the commands to draw the page and the resources dictionary
  const commands: PDFOperator[] = [];
  const XObjectDict = doc.context.obj({});

  for (const p of pages) {
    const ref = pageMap.get(p);
    if (ref) {
      // create a new form XObject for the page
      const xRef = await getFormXObjectForPage(doc.context, ref);
      if (!xRef) {
        throw new Error(`Failed to create form XObject for page ${p}`);
      }

      const pageName = `Page${p}`;

      // Add commands to the content stream to draw the form
      commands.push(pushGraphicsState());
      commands.push(concatTransformationMatrix(1, 0, 0, 1, x, y));
      commands.push(drawObject(pageName));
      commands.push(popGraphicsState());

      // Update the resources dictionary
      XObjectDict.set(PDFName.of(pageName), xRef);
    }

    // Adjust the position for the next page
    switch (settings.lineDirection) {
      case LineDirection.Column:
        x += pageSize.width;
        if (x > outWidth - margin) {
          x = 0;
          y -= pageSize.height;
        }
        break;
      case LineDirection.Row:
        y -= pageSize.height;
        if (y < -margin) {
          y = outHeight - pageSize.height;
          x += pageSize.width;
        }
        break;
    }
  }

  // Write the commands to the content stream
  const dict = doc.context.obj({});
  const contentStream = PDFContentStream.of(dict, commands);
  outPage.node.set(PDFName.Contents, doc.context.register(contentStream));

  // Update the resources dictionary
  const resources = outPage.node.get(PDFName.of("Resources")) as
    | PDFDict
    | undefined;
  if (resources) {
    resources.set(PDFName.of("XObject"), XObjectDict);
  } else {
    outPage.node.set(
      PDFName.of("Resources"),
      doc.context.obj({ XObject: XObjectDict }),
    );
  }
}

export async function savePDF(
  file: File,
  settings: StitchSettings,
  layers: Layers,
  password: string = "",
) {
  // Grab the bytes from the file object and try to load the PDF
  // Error handling is done in the calling function.
  const pdfBytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(pdfBytes, {
    ignoreEncryption: true,
    password,
  });

  // Toggle the visibility of layers
  toggleLayers(doc, layers);

  // if it's a one-page document, we're done. Otherwise, stitch it together.
  if (doc.getPageCount() > 1) {
    await tilePages(doc, settings);
  }

  // Save the modified document and return the blob
  return await doc.save();
}
