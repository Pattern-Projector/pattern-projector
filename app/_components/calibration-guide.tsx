import { useTranslations } from "next-intl";
import React, { PointerEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/_components/buttons/button";
import { ButtonStyle, getButtonStyleClasses } from "@/_components/theme/styles";
import { ButtonColor, getColorClasses } from "@/_components/theme/colors";
import {
  GuideStep,
  Placement,
  guideSteps,
  nextGuideStep,
  previousGuideStep,
  rotatePlacement,
  scalePlacement,
  targetFileName,
} from "@/_lib/guided-calibration";

const positionKey = "calibrationGuidePosition";
const smallButton = "!px-3 !py-1.5 min-w-10 justify-center";
// Fine steps per click; hold Shift for steps ten times bigger
const rotateStep = (0.1 * Math.PI) / 180;
const scaleStep = 1.002;

function stepSize(e: React.MouseEvent) {
  return e.shiftKey ? 10 : 1;
}

/**
 * Step by step calibration: print a target, line the projection up with it, straighten the lens and fine-tune the
 * corners. Closing it leaves the usual corner calibration.
 */
export default function CalibrationGuide({
  step,
  setStep,
  isDarkTheme,
  adjustPlacement,
  lensCorrectionStrength,
  setLensCorrectionStrength,
}: {
  step: GuideStep | null;
  setStep: (step: GuideStep | null) => void;
  isDarkTheme: boolean;
  adjustPlacement: (change: (placement: Placement) => Placement) => void;
  lensCorrectionStrength: number;
  setLensCorrectionStrength: (strength: number) => void;
}) {
  const t = useTranslations("CalibrationGuide");
  // The panel stays in the same place for every step, bottom left by default, and can be dragged by its title
  const [position, setPosition] = useState({ left: 16, bottom: 16 });
  const dragStart = useRef<{
    x: number;
    y: number;
    left: number;
    bottom: number;
  } | null>(null);
  // The latest position, for saving when the drag ends: the pointer can be released before React re-renders
  const latestPosition = useRef(position);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(positionKey) ?? "null");
      if (
        typeof saved?.left === "number" &&
        typeof saved?.bottom === "number"
      ) {
        setPosition(saved);
        latestPosition.current = saved;
      }
    } catch (e) {}
  }, []);

  function handleDragStart(e: PointerEvent<HTMLElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, ...position };
  }

  function handleDragMove(e: PointerEvent<HTMLElement>) {
    const start = dragStart.current;
    if (start === null) return;
    const maxLeft = window.innerWidth - 64;
    const maxBottom = window.innerHeight - 64;
    const next = {
      left: Math.min(maxLeft, Math.max(0, start.left + e.clientX - start.x)),
      bottom: Math.min(
        maxBottom,
        Math.max(0, start.bottom - (e.clientY - start.y)),
      ),
    };
    latestPosition.current = next;
    setPosition(next);
  }

  function handleDragEnd() {
    if (dragStart.current === null) return;
    dragStart.current = null;
    localStorage.setItem(positionKey, JSON.stringify(latestPosition.current));
  }

  const panelColors = isDarkTheme
    ? "bg-black text-white border-white"
    : "bg-white text-black border-black";

  if (step === null) {
    return (
      <Button
        className={`${isDarkTheme ? "bg-black" : "bg-white"} absolute bottom-4 left-1/2 -translate-x-1/2 z-20`}
        onClick={() => setStep(GuideStep.Print)}
      >
        {t("open")}
      </Button>
    );
  }

  const stepNumber = guideSteps.indexOf(step) + 1;
  const isLastStep = nextGuideStep(step) === null;

  return (
    <section
      data-testid="calibration-guide"
      aria-label={t("title")}
      style={position}
      className={`${panelColors} absolute z-20 w-[min(26rem,calc(100vw-2rem))] border-2 rounded-lg p-4 flex flex-col gap-3 text-sm`}
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <header
        data-testid="calibration-guide-handle"
        title={t("drag")}
        className="flex items-baseline justify-between gap-2 cursor-move touch-none select-none"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        <h2 className="font-bold text-base">
          {t("stepOf", { step: stepNumber, count: guideSteps.length })}{" "}
          {t(`${step}.title`)}
        </h2>
        <button
          type="button"
          className="underline text-gray-600 dark:text-gray-300"
          onClick={() => setStep(null)}
        >
          {step === GuideStep.Corners || isLastStep ? t("close") : t("skip")}
        </button>
      </header>
      <p>{t(`${step}.description`)}</p>

      {step === GuideStep.Print && (
        <div>
          <a
            href={targetFileName}
            // Download rather than open it, which would leave full screen
            download="pattern-projector-calibration-target.pdf"
            className={`w-fit ${getButtonStyleClasses(ButtonStyle.OUTLINE)} ${getColorClasses(ButtonColor.PURPLE, ButtonStyle.OUTLINE)}`}
          >
            {t("print.download")}
          </a>
        </div>
      )}

      {step === GuideStep.Align && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            className={smallButton}
            ariaLabel={t("align.smaller")}
            onClick={(e) =>
              adjustPlacement((p) =>
                scalePlacement(p, Math.pow(scaleStep, -stepSize(e))),
              )
            }
          >
            −
          </Button>
          <Button
            className={smallButton}
            ariaLabel={t("align.bigger")}
            onClick={(e) =>
              adjustPlacement((p) =>
                scalePlacement(p, Math.pow(scaleStep, stepSize(e))),
              )
            }
          >
            +
          </Button>
          <Button
            className={smallButton}
            ariaLabel={t("align.rotateLeft")}
            onClick={(e) =>
              adjustPlacement((p) =>
                rotatePlacement(p, -rotateStep * stepSize(e)),
              )
            }
          >
            ↺
          </Button>
          <Button
            className={smallButton}
            ariaLabel={t("align.rotateRight")}
            onClick={(e) =>
              adjustPlacement((p) =>
                rotatePlacement(p, rotateStep * stepSize(e)),
              )
            }
          >
            ↻
          </Button>
          <span className="text-gray-600 dark:text-gray-300">
            {t("align.hint")}
          </span>
        </div>
      )}

      {step === GuideStep.Lens && (
        <div className="flex items-center gap-2">
          <Button
            className={smallButton}
            ariaLabel={t("lens.less")}
            onClick={() =>
              setLensCorrectionStrength(lensCorrectionStrength - 0.25)
            }
          >
            −
          </Button>
          <output
            data-testid="guide-lens-value"
            className="min-w-16 text-center font-medium"
          >
            {lensCorrectionStrength}%
          </output>
          <Button
            className={smallButton}
            ariaLabel={t("lens.more")}
            onClick={() =>
              setLensCorrectionStrength(lensCorrectionStrength + 0.25)
            }
          >
            +
          </Button>
        </div>
      )}

      <footer className="flex justify-between">
        <Button
          className={step === GuideStep.Print ? "invisible" : ""}
          onClick={() => setStep(previousGuideStep(step))}
        >
          {t("back")}
        </Button>
        <Button
          style={ButtonStyle.FILLED}
          onClick={() => setStep(nextGuideStep(step))}
        >
          {isLastStep ? t("done") : t("next")}
        </Button>
      </footer>
    </section>
  );
}
