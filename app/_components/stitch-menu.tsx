import { ChangeEvent, Dispatch } from "react";
import { useTranslations } from "next-intl";
import Input from "@/_components/input";
import { IconButton } from "@/_components/buttons/icon-button";
import CloseIcon from "@/_icons/close-icon";
import StepperInput from "@/_components/stepper-input";
import { StitchSettings } from "@/_lib/interfaces/stitch-settings";
import { StitchSettingsAction } from "@/_reducers/stitchSettingsReducer";
import { allowInteger } from "@/_lib/remove-non-digits";

export default function StitchMenu({
  dispatchStitchSettings,
  stitchSettings,
  pageCount,
  className,
  showMenu,
  setShowMenu,
}: {
  dispatchStitchSettings: Dispatch<StitchSettingsAction>;
  stitchSettings: StitchSettings;
  pageCount: number;
  className?: string;
  showMenu: boolean;
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

  return (
    <menu
      className={`flex justify-between ${showMenu ? "top-16" : "-top-60"} absolute left-0 w-full z-30 transition-all duration-700 ${className} bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 p-2`}
    >
      <div className="flex gap-2">
        <div className="ml-1">
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
        </div>
        <StepperInput
          inputClassName="w-24"
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
        <div className="ml-1">
          <StepperInput
            inputClassName="w-24"
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
        </div>
        <div className="ml-1">
          <StepperInput
            inputClassName="w-24"
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
        </div>
      </div>
      <IconButton onClick={() => setShowMenu(false)}>
        <CloseIcon ariaLabel="close" />
      </IconButton>
    </menu>
  );
}
