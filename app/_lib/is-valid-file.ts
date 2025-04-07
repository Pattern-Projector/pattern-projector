export const acceptedMimeTypes = [
  "image/svg+xml",
  "application/pdf",
  "application/xml", // Drive classifies Inkscape SVGs as XML text on iPad
];

export const acceptedExtensions = [".PDF", ".SVG"];

// Check if selected file is a PDF or accepted image type
export default function isValidFile(file: File): boolean {
  for (const type of acceptedMimeTypes) {
    if (file.type === type) {
      return true;
    }
  }

  if (file.type === "" && file.name) {
    const fileName = file.name;
    const lastDotIndex = fileName.lastIndexOf(".");
    for (const extension of acceptedExtensions) {
      if (
        lastDotIndex === -1 ||
        fileName.substring(lastDotIndex).toUpperCase() !== extension
      ) {
        return false;
      }
    }
    return true;
  }
  return false;
}
