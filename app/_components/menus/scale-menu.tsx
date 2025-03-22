import StepperInput from "@/_components/stepper-input";
import { Dispatch, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PatternScaleAction } from "@/_reducers/patternScaleReducer";
import { sideMenuStyles } from "../theme/styles";
import removeNonDigits, {
  decimalToString,
  roundTo,
} from "@/_lib/remove-non-digits";

export default function ScaleMenu({
  patternScale,
  dispatchPatternScaleAction,
}: {
  patternScale: string;
  dispatchPatternScaleAction: Dispatch<PatternScaleAction>;
}) {
  const t = useTranslations("ScaleMenu");

  const scaleValue: string = useMemo(() => {
    const number = +patternScale;
    if (Number.isNaN(number)) {
      return "1";
    }
    return patternScale;
  }, [patternScale]);

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
        value={scaleValue}
        onStep={(delta) =>
          dispatchPatternScaleAction({ type: "delta", delta: delta })
        }
        step={0.05}
      ></StepperInput>
    </menu>
  );
}
