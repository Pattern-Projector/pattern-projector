import StepperInput from "@/_components/stepper-input";
import { Dispatch } from "react";
import removeNonDigits from "@/_lib/remove-non-digits";
import { useTranslations } from "next-intl";
import { PatternScaleAction } from "@/_reducers/patternScaleReducer";
import { sideMenuStyles } from "../theme/styles";
import InlineSelect from "@/_components/inline-select";
import { SVG_DPI_OPTIONS } from "@/_lib/svg-size";

export default function ScaleMenu({
  patternScale,
  dispatchPatternScaleAction,
  svgDpi,
  setSvgDpi,
}: {
  patternScale: string;
  dispatchPatternScaleAction: Dispatch<PatternScaleAction>;
  /** Only set for SVGs whose size has no units */
  svgDpi: number | null;
  setSvgDpi: (dpi: number) => void;
}) {
  const t = useTranslations("ScaleMenu");

  return (
    <menu className={`${sideMenuStyles}`}>
      <StepperInput
        inputClassName="w-20"
        handleChange={(e) =>
          dispatchPatternScaleAction({
            type: "set",
            scale: removeNonDigits(e.target.value, patternScale),
          })
        }
        label={t("scale")}
        value={patternScale}
        onStep={(delta) =>
          dispatchPatternScaleAction({ type: "delta", delta: delta })
        }
        step={0.1}
      ></StepperInput>
      {svgDpi !== null && (
        <div className="flex flex-col">
          <label
            htmlFor="svg-dpi"
            className="text-sm font-medium text-gray-900 dark:text-white ml-1"
          >
            {t("svgDpi")}
          </label>
          <InlineSelect
            id="svg-dpi"
            name="svg-dpi"
            value={String(svgDpi)}
            options={SVG_DPI_OPTIONS.map((dpi) => ({
              value: String(dpi),
              label: String(dpi),
            }))}
            handleChange={(e) => setSvgDpi(Number(e.target.value))}
          />
        </div>
      )}
    </menu>
  );
}
