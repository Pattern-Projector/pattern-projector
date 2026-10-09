export const acceptedMimeTypes = [
  "image/svg+xml",
  "application/pdf",
  "application/xml", // Drive classifies Inkscape SVGs as XML text on iPad
  "image/vnd.dxf",
  "application/dxf",
];

export const acceptedExtensions = [".PDF", ".SVG", ".DXF"];

/** Value for the file input's accept attribute (DXF files rarely have a MIME type) */
export const acceptAttribute = [
  ...acceptedMimeTypes,
  ...acceptedExtensions.map((e) => e.toLowerCase()),
].join(",");

// Check if selected file is a PDF, SVG or DXF
export default function isValidFile(file: File): boolean {
  if (acceptedMimeTypes.includes(file.type)) {
    return true;
  }
  const name = file.name ?? "";
  const lastDotIndex = name.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return false;
  }
  const extension = name.substring(lastDotIndex).toUpperCase();
  // DXF files get various or empty MIME types depending on the OS. SVGs without a
  // type are shown with the SVG viewer; PDFs always need their MIME type.
  return extension === ".DXF" || (file.type === "" && extension === ".SVG");
}
