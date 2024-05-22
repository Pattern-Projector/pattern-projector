import { ChangeEvent, Dispatch } from "react";
import { useTranslations } from "next-intl";
import Input from "@/_components/input";
import { IconButton } from "@/_components/buttons/icon-button";
import CloseIcon from "@/_icons/close-icon";
import StepperInput from "@/_components/stepper-input";
import { StitchSettings } from "@/_lib/interfaces/stitch-settings";
import { StitchSettingsAction } from "@/_reducers/stitchSettingsReducer";
import { allowInteger } from "@/_lib/remove-non-digits";
import PdfIcon from "@/_icons/pdf-icon";
import { saveStitchedPDF } from "@/_lib/pdfstitcher";

export default function StitchMenu({
  file,
  dispatchStitchSettings,
  stitchSettings,
  pageCount,
  className,
  setShowMenu,
}: {
  file: File | null;
  dispatchStitchSettings: Dispatch<StitchSettingsAction>;
  stitchSettings: StitchSettings;
  pageCount: number;
  className?: string;
  setShowMenu: (showMenu: boolean) => void;
}) {
  const t = useTranslations("StitchMenu");

  function handleEdgeInsetChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const edgeInsets = { ...stitchSettings.edgeInsets };
    const inset = Number(allowInteger(value));
    if (name.localeCompare("horizontal") === 0) {
      edgeInsets.horizontal = inset;
    } else if (name.localeCompare("vertical") === 0) {
      edgeInsets.vertical = inset;
    }
    dispatchStitchSettings({ type: "set-edge-insets", edgeInsets });
  }

  function stitchFileSuccess(pdfBytes: Uint8Array) {
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file?.name.replace(".pdf", "-stitched.pdf") ?? "stitched.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSaveChange(e: React.MouseEvent<HTMLButtonElement>) {
    if (file === null) return;

    // Try saving stitched PDF, prompting for password if necessary.
    try {
      saveStitchedPDF(file, stitchSettings, pageCount).then(stitchFileSuccess);
    } catch (e: Error | any) {
      if (e instanceof Error && e.message === "Invalid password") {
        const response = prompt(t("encryptedPDF"));
        // User cancelled, do nothing
        if (response === null) return;
        saveStitchedPDF(file, stitchSettings, pageCount, response).then(
          stitchFileSuccess
        );
      } else {
        console.error(e);
      }
    }
  }

  return (
    <menu
      className={`${className ?? ""} flex justify-between left-0 w-full transition-all duration-700 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 p-2`}
    >
      <div className="flex gap-4">
        <Input
          inputClassName="w-36"
          handleChange={(e) =>
            dispatchStitchSettings({
              type: "set-page-range",
              pageRange: e.target.value,
            })
          }
          label={t("pageRange")}
          value={stitchSettings.pageRange}
        />
        <StepperInput
          inputClassName="w-12"
          handleChange={(e) =>
            dispatchStitchSettings({
              type: "set-column-count",
              columnCount: e.target.value
                ? Number(allowInteger(e.target.value))
                : 0,
              pageCount,
            })
          }
          label={t("columnCount")}
          value={
            stitchSettings.columnCount === 0
              ? ""
              : String(stitchSettings.columnCount)
          }
          onStep={(increment: number) =>
            dispatchStitchSettings({
              type: "step-column-count",
              pageCount,
              step: increment,
            })
          }
        />
        <StepperInput
          inputClassName="w-12"
          handleChange={handleEdgeInsetChange}
          label={t("horizontal")}
          name="horizontal"
          value={
            stitchSettings.edgeInsets.horizontal === 0
              ? ""
              : String(stitchSettings.edgeInsets.horizontal)
          }
          onStep={(increment: number) =>
            dispatchStitchSettings({
              type: "step-horizontal",
              step: increment,
            })
          }
        />

        <StepperInput
          inputClassName="w-12"
          handleChange={handleEdgeInsetChange}
          label={t("vertical")}
          name="vertical"
          value={
            stitchSettings.edgeInsets.vertical === 0
              ? ""
              : String(stitchSettings.edgeInsets.vertical)
          }
          onStep={(increment: number) =>
            dispatchStitchSettings({ type: "step-vertical", step: increment })
          }
        />
        <button
          className="flex gap-2 items-center outline outline-purple-600 text-purple-600 focus:ring-2 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800  hover:bg-purple-600 hover:text-white font-medium rounded-lg text-sm px-2 py-1.5 hover:bg-none text-center"
          onClick={handleSaveChange}
        >
          <PdfIcon ariaLabel={t("save")} fill="currentColor" />
          {t("save")}
        </button>
      </div>
      <IconButton onClick={() => setShowMenu(false)}>
        <CloseIcon ariaLabel="close" />
      </IconButton>
    </menu>
  );
}
