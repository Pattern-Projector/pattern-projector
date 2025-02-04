import { ChangeEvent, Dispatch } from "react";
import { useTranslations } from "next-intl";
import StepperInput from "@/_components/stepper-input";
import {
  LineDirection,
  StitchSettings,
} from "@/_lib/interfaces/stitch-settings";
import { StitchSettingsAction } from "@/_reducers/stitchSettingsReducer";
import { allowInteger } from "@/_lib/remove-non-digits";
import SaveButton from "@/_components/save-button";
import { Layers } from "@/_lib/layers";
import { sideMenuStyles } from "@/_components/theme/styles";
import Tooltip from "@/_components/tooltip/tooltip";
import { rotateRange } from "@/_lib/get-page-numbers";
import InlineSelect from "../inline-select";

export default function StitchMenu({
  dispatchStitchSettings,
  stitchSettings,
  pageCount,
  file,
  layers,
}: {
  dispatchStitchSettings: Dispatch<StitchSettingsAction>;
  stitchSettings: StitchSettings;
  pageCount: number;
  file: File | null;
  layers: Layers;
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

  const vh = Math.max(
    document.documentElement.clientHeight || 0,
    window.innerHeight || 0,
  );
  return (
    <>
      <menu
        className={`${sideMenuStyles} ${vh < 478 ? "h-[calc(100vh-8rem)] overflow-y-auto scrollbar" : "h-fit"}`}
      >
        <Tooltip description={t("zeros")}>
          <StepperInput
            inputClassName="w-36"
            handleChange={(e) =>
              dispatchStitchSettings({
                type: "set-page-range",
                pageRange: e.target.value,
              })
            }
            label={t("pageRange")}
            name="page-range"
            value={stitchSettings.pageRange}
            onStep={(increment: number) =>
              dispatchStitchSettings({
                type: "set-page-range",
                pageRange: rotateRange(
                  stitchSettings.pageRange,
                  pageCount,
                  increment,
                ),
              })
            }
          />
        </Tooltip>
        <div className="flex gap-1">
          <InlineSelect
            handleChange={(e) => {
              dispatchStitchSettings({
                type: "set",
                stitchSettings: {
                  ...stitchSettings,
                  lineDirection:
                    LineDirection[e.target.value as keyof typeof LineDirection],
                },
              });
            }}
            id="line-direction"
            name="line-direction"
            value={stitchSettings.lineDirection}
            options={[
              { value: LineDirection.Column, label: t("columnCount") },
              { value: LineDirection.Row, label: t("rowCount") },
            ]}
          ></InlineSelect>
          <StepperInput
            inputClassName="w-12"
            handleChange={(e) =>
              dispatchStitchSettings({
                type: "set-line-count",
                lineCount: e.target.value
                  ? Number(allowInteger(e.target.value))
                  : 0,
                pageCount,
              })
            }
            value={
              stitchSettings.lineCount === 0
                ? ""
                : String(stitchSettings.lineCount)
            }
            onStep={(increment: number) =>
              dispatchStitchSettings({
                type: "step-line-count",
                pageCount,
                step: increment,
              })
            }
          />
        </div>
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
      </menu>
    </>
  );
}
