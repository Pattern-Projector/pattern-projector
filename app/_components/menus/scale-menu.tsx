import StepperInput from "@/_components/stepper-input";
import { Dispatch, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PatternScaleAction } from "@/_reducers/patternScaleReducer";
import { sideMenuStyles } from "../theme/styles";
import { decimalToString, roundTo } from "@/_lib/remove-non-digits";

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
    return decimalToString(number, 2);
  }, [patternScale]);

  const convertInputToScale = (newString: string, oldString: string) => {
    const num = +newString.replace(/[^.\d]/g, "");
    if (!isNaN(num)) {
      return (num / 100).toString();
    }
    return oldString;
  };

  return (
    <menu className={`${sideMenuStyles}`}>
      <StepperInput
        inputClassName="w-20"
        handleChange={(e) =>
          dispatchPatternScaleAction({
            type: "set",
            scale: convertInputToScale(e.target.value, patternScale),
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
