import StepperInput from "@/_components/stepper-input";
import { Dispatch } from "react";
import removeNonDigits from "@/_lib/remove-non-digits";
import { useTranslations } from "next-intl";
import { PatternScaleAction } from "@/_reducers/patternScaleReducer";
import { sideMenuStyles } from "../theme/styles";

export default function ScaleMenu({
  patternScale,
  dispatchPatternScaleAction,
}: {
  patternScale: string;
  dispatchPatternScaleAction: Dispatch<PatternScaleAction>;
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
    </menu>
  );
}
