import StepperInput from "@/_components/stepper-input";
import { Dispatch } from "react";
import { useTranslations } from "next-intl";
import { PatternScaleAction } from "@/_reducers/patternScaleReducer";
import { sideMenuStyles } from "../theme/styles";
import allowFloat from "@/_lib/parsing";

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
            scale: allowFloat(e.target.value, patternScale),
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
