import { ChangeEvent, Dispatch, SetStateAction } from "react";
import { useTranslations } from "next-intl";
import Input from "@/_components/input";
import { IconButton } from "@/_components/buttons/icon-button";
import CloseIcon from "@/_icons/close-icon";
import StepperInput from "@/_components/stepper-input";
import { StitchSettings } from "@/_lib/interfaces/stitch-settings";
import { StitchSettingsAction } from "@/_reducers/stitchSettingsReducer";
import { allowInteger } from "@/_lib/remove-non-digits";
import SaveButton from "./save-button";
import { Layers } from "@/_lib/layers";
import Tooltip from "./tooltip/tooltip";
import { MenuStates } from "@/_lib/menu-states";
import FlexWrapIcon from "@/_icons/flex-wrap-icon";

export default function StitchMenu({
  dispatchStitchSettings,
  stitchSettings,
  pageCount,
  className,
  setShowMenu,
  file,
  layers,
  menuStates,
  setMenuStates,
}: {
  dispatchStitchSettings: Dispatch<StitchSettingsAction>;
  stitchSettings: StitchSettings;
  pageCount: number;
  className?: string;
  setShowMenu: (showMenu: boolean) => void;
  file: File | null;
  layers: Layers;
  menuStates: MenuStates;
  setMenuStates: Dispatch<SetStateAction<MenuStates>>;
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
        className={`${className ?? ""} flex justify-between items-center left-0 w-full transition-all duration-700 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 p-2`}
      >
        <div className="flex gap-4 items-end">
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
        <IconButton onClick={() => setShowMenu(false)} className="h-11">
          <CloseIcon ariaLabel="close" />
        </IconButton>
      </menu>
      {!menuStates.stitch ? (
        <Tooltip
          className="m-2 w-10 z-10"
          description={
            menuStates.stitch
              ? h("stitchMenuHide")
              : pageCount === 0
                ? h("stitchMenuDisabled")
                : h("stitchMenuShow")
          }
        >
          <IconButton
            border={true}
            disabled={pageCount === 0}
            onClick={() =>
              setMenuStates({ ...menuStates, stitch: !menuStates.stitch })
            }
            className={`${menuStates.stitch ? "!bg-gray-300 dark:!bg-gray-600" : ""}`}
          >
            <FlexWrapIcon
              ariaLabel={
                menuStates.stitch ? h("stitchMenuHide") : h("stitchMenuShow")
              }
            />
          </IconButton>
        </Tooltip>
      ) : null}
    </>
  );
}
