import React, { useEffect, useRef } from "react";
import { CanvasState, drawOverlays } from "@/_lib/drawing";
import { Point } from "@/_lib/point";
import { DisplaySettings, strokeColor } from "@/_lib/display-settings";
import {
  RestoreTransforms,
  getPerspectiveTransformFromPoints,
  isFlipped,
} from "@/_lib/geometry";
import { useTransformContext } from "@/_hooks/use-transform-context";
import Matrix from "ml-matrix";
import { useTranslations } from "next-intl";
import { Unit } from "@/_lib/unit";

export default function OverlayCanvas({
  className,
  points,
  width,
  height,
  unitOfMeasure,
  displaySettings,
  calibrationTransform,
  zoomedOut,
  magnifying,
  restoreTransforms,
  patternScale,
}: {
  className: string | undefined;
  points: Point[];
  width: number;
  height: number;
  unitOfMeasure: Unit;
  displaySettings: DisplaySettings;
  calibrationTransform: Matrix;
  zoomedOut: boolean;
  magnifying: boolean;
  restoreTransforms: RestoreTransforms | null;
  patternScale: string;
}) {
  const flipped = isFlipped(useTransformContext());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const t = useTranslations("OverlayCanvas");

  useEffect(() => {
    if (canvasRef !== null && canvasRef.current !== null) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx !== null && points.length == 4) {
        const perspectiveMatrix = getPerspectiveTransformFromPoints(
          points,
          width,
          height,
          1.0,
          false,
        );
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        const cs = new CanvasState(
          ctx,
          { x: 0, y: 0 },
          points,
          width,
          height,
          perspectiveMatrix,
          false,
          new Set<number>(),
          new Set<number>(),
          unitOfMeasure,
          strokeColor(displaySettings.theme),
          displaySettings,
          flipped,
          calibrationTransform,
          zoomedOut,
          magnifying,
          restoreTransforms,
          t,
          patternScale,
        );
        drawOverlays(cs);
      }
    }
  }, [
    points,
    width,
    height,
    unitOfMeasure,
    displaySettings,
    flipped,
    calibrationTransform,
    zoomedOut,
    magnifying,
    restoreTransforms,
    t,
    patternScale,
  ]);
  return (
    <canvas
      tabIndex={0}
      ref={canvasRef}
      className={`${className} pointer-events-none`}
    />
  );
}
