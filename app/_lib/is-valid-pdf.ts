/**
 * Check if selected file is a PDF
 * @returns Whether or not the file is a PDF
 */
export default function isValidPDF(file: File): boolean {
  if (file.type === "application/pdf") {
    return true;
  }
  if (file.type === "" && file.name) {
    const fileName = file.name;
    const lastDotIndex = fileName.lastIndexOf(".");
    if (
      lastDotIndex === -1 ||
      fileName.substring(lastDotIndex).toUpperCase() !== ".PDF"
    )
      return false;
    return true;
  }
  return false;
}
