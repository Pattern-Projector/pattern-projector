import { ChangeEvent, Dispatch } from "react";
import { useTranslations } from "next-intl";
import Input from "@/_components/input";
import { IconButton } from "@/_components/buttons/icon-button";
import StepperInput from "@/_components/stepper-input";
import { StitchSettings } from "@/_lib/interfaces/stitch-settings";
import { StitchSettingsAction } from "@/_reducers/stitchSettingsReducer";
import { allowInteger } from "@/_lib/remove-non-digits";
import SaveButton from "@/_components/save-button";
import { Layers } from "@/_lib/layers";
import Tooltip from "@/_components/tooltip/tooltip";
import FlexWrapIcon from "@/_icons/flex-wrap-icon";
import KeyboardArrowLeftIcon from "@/_icons/keyboard-arrow-left";

export default function StitchMenu({
  dispatchStitchSettings,
  stitchSettings,
  pageCount,
  file,
  layers,
  visible,
  setVisible,
}: {
  dispatchStitchSettings: Dispatch<StitchSettingsAction>;
  stitchSettings: StitchSettings;
  pageCount: number;
  file: File | null;
  layers: Layers;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}) {
  const t = useTranslations("StitchMenu");
  const h = useTranslations("Header");

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
    <>
      <menu
        className={`pointer-events-auto flex justify-between items-center left-0 transition-all duration-700 dark:bg-opacity-50 bg-opacity-60 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 py-2 pr-2`}
      >
        <div className="gap-2 flex flex-wrap items-end">
          <Tooltip description={h("stitchMenuHide")} className="z-30">
            <IconButton onClick={() => setVisible(false)} className="h-11">
              <KeyboardArrowLeftIcon ariaLabel="close" />
            </IconButton>
          </Tooltip>
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
          <SaveButton
            file={file}
            stitchSettings={stitchSettings}
            layers={layers}
          />
        </div>
      </menu>
      {!visible ? (
        <Tooltip
          className="ml-3 mt-2 w-10 z-30 pointer-events-auto"
          description={
            visible
              ? h("stitchMenuHide")
              : pageCount === 0
                ? h("stitchMenuDisabled")
                : h("stitchMenuShow")
          }
        >
          <IconButton
            border={true}
            disabled={pageCount === 0}
            onClick={() => setVisible(true)}
            className={`${visible ? "!bg-gray-300 dark:!bg-gray-600" : ""}`}
          >
            <FlexWrapIcon
              ariaLabel={visible ? h("stitchMenuHide") : h("stitchMenuShow")}
            />
          </IconButton>
        </Tooltip>
      ) : null}
    </>
  );
}
