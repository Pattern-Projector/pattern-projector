import StepperInput from "@/_components/stepper-input";
import { Dispatch } from "react";
import { allowFloat } from "@/_lib/remove-non-digits";
import { useTranslations } from "next-intl";
import { PatternScaleAction } from "@/_reducers/patternScaleReducer";
import { sideMenuStyles } from "../theme/styles";

export default function ScaleMenu({
  patternScale,
  dispatchPatternScaleAction,
}: {
  patternScale: number;
  dispatchPatternScaleAction: Dispatch<PatternScaleAction>;
}) {
  const t = useTranslations("ScaleMenu");

  return (
    <menu className={`${sideMenuStyles}`}>
      <StepperInput
        handleChange={(e) =>
          dispatchPatternScaleAction({
            type: "set",
            scale: e.target.value
              ? Number(allowFloat(e.target.value)) / 100
              : 0,
          })
        }
        label={t("scale")}
        value={String(patternScale * 100)}
        onStep={(delta) =>
          dispatchPatternScaleAction({ type: "delta", delta: delta / 100 })
        }
      ></StepperInput>
    </menu>
  );
}
