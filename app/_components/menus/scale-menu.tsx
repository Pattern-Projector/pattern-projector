import { useTranslations } from "next-intl";
import { IconButton } from "../buttons/icon-button";
import Tooltip from "../tooltip/tooltip";
import MagnifyIcon from "@/_icons/magnify-icon";
import KeyboardArrowLeftIcon from "@/_icons/keyboard-arrow-left";
import StepperInput from "../stepper-input";
import { Dispatch, SetStateAction } from "react";
import removeNonDigits from "@/_lib/remove-non-digits";

export default function ScaleMenu({
  patternScale,
  setPatternScale,
  visible,
  setVisible,
}: {
  patternScale: number;
  setPatternScale: Dispatch<SetStateAction<number>>;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}) {
  const t = useTranslations("ScaleMenu");
  return (
    <div className="flex items-center">
      <div className="mx-3 my-2 w-10 pointer-events-auto">
        {visible ? (
          <Tooltip description={t("hide")} className="z-20">
            <IconButton border={true} onClick={() => setVisible(false)}>
              <KeyboardArrowLeftIcon ariaLabel={t("hide")} />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip description={t("scale")}>
            <IconButton border={true} onClick={() => setVisible(true)}>
              <MagnifyIcon ariaLabel={t("scale")} />
            </IconButton>
          </Tooltip>
        )}
      </div>
      {visible && (
        <menu className="pointer-events-auto">
          <StepperInput
            handleChange={(e) =>
              setPatternScale(
                e.target.value
                  ? Number(
                      removeNonDigits(e.target.value, String(patternScale)),
                    )
                  : 0,
              )
            }
            label={t("scale")}
            value={String(patternScale * 100)}
            onStep={(delta) => setPatternScale((prev) => prev + delta / 100)}
          ></StepperInput>
        </menu>
      )}
    </div>
  );
}
