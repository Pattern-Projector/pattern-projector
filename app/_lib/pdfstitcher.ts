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
  PDFRawStream,
  decodePDFRawStream,
} from "@cantoo/pdf-lib";
import {
  LineDirection,
  StitchSettings,
} from "@/_lib/interfaces/stitch-settings";
import { getPageNumbers, getRowsColumns } from "./get-page-numbers";
import { Layers } from "./layers";

// --- HELPERS ---

function getAsDict(name: string, dict: PDFDict): PDFDict | undefined {
  const obj = dict.get(PDFName.of(name));
  if (obj instanceof PDFDict) return obj;
  if (obj instanceof PDFRef) return dict.context.lookup(obj, PDFDict);
  return undefined;
}

/** * Safely extracts numeric values from various internal pdf-lib types to avoid "numberValue is not a function"
 */
const getNum = (obj: any): number => {
  if (typeof obj === "number") return obj;
  if (!obj) return 0;
  if (typeof obj.numberValue === "function") return obj.numberValue();
  if (typeof obj.value === "number") return obj.value;
  return parseFloat(obj.toString()) || 0;
};

// --- CORE LOGIC ---

/**
 * Physically strips vector data belonging to hidden layers to reduce file size and clutter
 */
function cleanPageStream(page: PDFPageLeaf, activeRefs: Set<string>) {
  const resources = getAsDict("Resources", page) || page.context.obj({});
  const props = getAsDict("Properties", resources);
  const hiddenNames = new Set<string>();

  if (props) {
    props.entries().forEach(([name, value]) => {
      const refStr = value instanceof PDFRef ? value.toString() : "";
      if (refStr && !activeRefs.has(refStr)) {
        hiddenNames.add(name.toString().replace(/^\//, ""));
        props.delete(name);
      }
    });
  }

  const contents = page.Contents();
  if (!contents) return;

  const streams =
    contents instanceof PDFArray ? contents.asArray() : [contents];
  let rawText = "";
  for (const ref of streams) {
    const stream = page.context.lookup(ref, PDFStream);
    const data =
      stream instanceof PDFRawStream
        ? decodePDFRawStream(stream).decode()
        : (stream as any).getUnencodedContents();
    rawText += new TextDecoder().decode(data) + " ";
  }

  // Split by BDC/EMC (Marked Content) operators to identify and remove hidden layer blocks
  const segments = rawText.split(/(\bBDC\b|\bEMC\b)/);
  let cleaned = "";
  let skipDepth = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg === "BDC") {
      const metadata = segments[i - 1] || "";
      const isHidden = Array.from(hiddenNames).some((h) =>
        metadata.includes(`/${h}`),
      );
      if (isHidden || skipDepth > 0) skipDepth++;
      else cleaned += seg;
    } else if (seg === "EMC") {
      if (skipDepth > 0) skipDepth--;
      else cleaned += seg;
    } else if (skipDepth === 0) {
      cleaned += seg;
    }
  }

  const newStream = page.context.flateStream(new TextEncoder().encode(cleaned));
  page.set(PDFName.Contents, page.context.register(newStream));
}

/**
 * Normalizes a page into a 0,0-based Form XObject to ensure predictable tiling
 */
function pageToXObject(page: PDFPageLeaf): {
  ref: PDFRef;
  width: number;
  height: number;
} {
  const context = page.context;
  const box =
    page.get(PDFName.of("CropBox")) || page.get(PDFName.of("MediaBox"));
  if (!(box instanceof PDFArray)) throw new Error("No boundary found");

  const coords = box.asArray().map(getNum);
  const [x1, y1, x2, y2] = coords;
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);
  const minX = Math.min(x1, x2);
  const minY = Math.min(y1, y2);

  const contents = page.Contents();
  let rawData: Uint8Array;
  if (contents instanceof PDFArray) {
    const parts = contents.asArray().map((ref) => {
      const s = context.lookup(ref, PDFStream);
      return s instanceof PDFRawStream
        ? decodePDFRawStream(s).decode()
        : (s as any).getUnencodedContents();
    });
    rawData = new Uint8Array(parts.reduce((acc, p) => acc + p.length, 0));
    let offset = 0;
    for (const p of parts) {
      rawData.set(p, offset);
      offset += p.length;
    }
  } else {
    const s = context.lookup(contents!, PDFStream);
    rawData =
      s instanceof PDFRawStream
        ? decodePDFRawStream(s).decode()
        : (s as any).getUnencodedContents();
  }

  // Encapsulation Fix: We wrap the content in a transformation (cm) that moves internal
  // page coordinates to 0,0. This prevents multiple pages from "cramming" at the original offset.
  const encoder = new TextEncoder();
  const wrapper = encoder.encode(`q 1 0 0 1 ${-minX} ${-minY} cm\n`);
  const closer = encoder.encode(`\nQ`);
  const finalData = new Uint8Array(
    wrapper.length + rawData.length + closer.length,
  );
  finalData.set(wrapper, 0);
  finalData.set(rawData, wrapper.length);
  finalData.set(closer, wrapper.length + rawData.length);

  const xObject = context.flateStream(finalData, {
    Type: PDFName.of("XObject"),
    Subtype: PDFName.of("Form"),
    BBox: [0, 0, width, height], // Resetting BBox to 0,0 for standard tiling
    Resources: page.get(PDFName.of("Resources")),
  });

  return { ref: context.register(xObject), width, height };
}

async function tilePages(
  doc: PDFDocument,
  settings: StitchSettings,
  activeRefs: Set<string>,
) {
  const pages = getPageNumbers(settings.pageRange, doc.getPageCount());
  const [rows, cols] = getRowsColumns(
    pages,
    settings.lineCount,
    settings.lineDirection,
  );
  const pageMap = new Map<number, ReturnType<typeof pageToXObject>>();

  for (const pNum of pages) {
    if (pNum > 0) {
      const page = doc.getPage(pNum - 1);
      cleanPageStream(page.node, activeRefs);
      pageMap.set(pNum, pageToXObject(page.node));
    }
  }

  const firstPage = pageMap.get(pages.find((p) => p > 0)!)!;
  const w = firstPage.width - settings.edgeInsets.horizontal;
  const h = firstPage.height - settings.edgeInsets.vertical;

  while (doc.getPageCount() > 0) doc.removePage(0);

  // Canvas size + 1" (72pt) margins on all sides
  const outPage = doc.addPage([w * cols + 144, h * rows + 144]);
  let x = 72,
    y = h * rows - h + 72;
  const XObjectDict = doc.context.obj({});
  const commands: PDFOperator[] = [];

  for (const p of pages) {
    const data = pageMap.get(p);
    if (data) {
      const name = `P${p}`;
      commands.push(
        pushGraphicsState(),
        concatTransformationMatrix(1, 0, 0, 1, x, y),
        drawObject(name),
        popGraphicsState(),
      );
      XObjectDict.set(PDFName.of(name), data.ref);
    }
    if (settings.lineDirection === LineDirection.Column) {
      x += w;
      if (x > w * cols + 5) {
        x = 72;
        y -= h;
      }
    } else {
      y -= h;
      if (y < 70) {
        y = h * rows - h + 72;
        x += w;
      }
    }
  }

  outPage.node.set(
    PDFName.Contents,
    doc.context.register(PDFContentStream.of(doc.context.obj({}), commands)),
  );
  outPage.node.set(
    PDFName.of("Resources"),
    doc.context.obj({ XObject: XObjectDict }),
  );
}

/**
 * Main entry point: Loads PDF, filters layers (handling reserved slashes), and tiles pages
 */
export async function savePDF(
  file: File,
  settings: StitchSettings,
  layers: Layers,
  password = "",
) {
  const doc = await PDFDocument.load(await file.arrayBuffer(), {
    ignoreEncryption: true,
    password,
  });
  const activeRefs = new Set<string>();
  const ocprops = getAsDict("OCProperties", doc.catalog);

  if (ocprops) {
    const ocgs = ocprops.get(PDFName.of("OCGs"));
    if (ocgs instanceof PDFArray) {
      const keptOCGRefs: PDFRef[] = [];
      ocgs.asArray().forEach((ref) => {
        if (!(ref instanceof PDFRef)) return;
        const ocg = doc.context.lookup(ref, PDFDict);

        // Slash-safe name matching: handles PDF-encoded slashes (#2f) and internal slashes like "0/30"
        const name = (ocg.get(PDFName.of("Name"))?.toString() || "")
          .replace(/^\//, "")
          .replace(/#2f/gi, "/")
          .replace(/[()]/g, "")
          .trim()
          .toLowerCase();

        const match = Object.values(layers).find(
          (l) => l.name.replace(/[()]/g, "").trim().toLowerCase() === name,
        );

        if (match?.visible) {
          keptOCGRefs.push(ref);
          activeRefs.add(ref.toString());
        }
      });

      // Update Catalog OCGs and Order to remove hidden layers from the UI sidebar menu
      const newOCGs = doc.context.obj(keptOCGRefs);
      ocprops.set(PDFName.of("OCGs"), newOCGs);
      const D = getAsDict("D", ocprops);
      if (D) {
        D.set(PDFName.of("ON"), newOCGs);
        D.set(PDFName.of("Order"), newOCGs);
      }
    }
  }

  await tilePages(doc, settings, activeRefs);
  return await doc.save();
}
