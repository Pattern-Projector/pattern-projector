import { Layer } from "@/_lib/interfaces/layer";
import { StitchSettings } from "@/_lib/interfaces/stitch-settings";
import { savePDF } from "@/_lib/pdfstitcher";
import { useTranslations } from "next-intl";
import PdfIcon from "@/_icons/pdf-icon";

export default function SaveButton({
  file,
  stitchSettings,
  layers,
}: {
  file: File | null;
  stitchSettings: StitchSettings;
  layers: Map<string, Layer>;
}) {
  const t = useTranslations("SaveMenu");

  async function handleSave() {
    if (file === null) return;

    function saveFileSuccess(pdfBytes: Uint8Array) {
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        file?.name.replace(".pdf", "-stitched.pdf") ?? "stitched.pdf";
      a.click();
      URL.revokeObjectURL(url);
    }

    function stitchFileError(e: Error | any) {
      if (
        (e instanceof Error && e.message.includes("encrypted")) ||
        e.message.includes("password")
      ) {
        const response = prompt(t("encryptedPDF"));
        // User cancelled, do nothing
        if (response === null || file === null) return;
        savePDF(file, stitchSettings, layers, response).then(saveFileSuccess);
      } else {
        console.error(e);
      }
    }

    savePDF(file, stitchSettings, layers)
      .then(saveFileSuccess)
      .catch(stitchFileError);
  }

  return (
    <>
      <button
        className="flex gap-2 items-center outline outline-purple-600 text-purple-600 focus:ring-2 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800  hover:bg-purple-600 hover:text-white font-medium rounded-lg text-sm px-2 py-1.5 hover:bg-none text-center"
        onClick={handleSave}
        style={{
          position: "fixed",
          bottom: "10px",
          left: "10px",
        }}
      >
        <PdfIcon ariaLabel={t("save")} fill="currentColor" />
        {t("save")}
      </button>
    </>
  );
}
