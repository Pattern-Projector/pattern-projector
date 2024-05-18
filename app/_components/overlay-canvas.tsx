import React, { useEffect, useRef } from "react";
import { CanvasState, drawOverlays } from "@/_lib/drawing";
import { Point } from "@/_lib/point";
import { DisplaySettings, strokeColor } from "@/_lib/display-settings";
import { getPerspectiveTransformFromPoints } from "@/_lib/geometry";

export default function OverlayCanvas({
  className,
  points,
  width,
  height,
  unitOfMeasure,
  displaySettings,
}: {
  className: string | undefined;
  points: Point[];
  width: number;
  height: number;
  unitOfMeasure: string;
  displaySettings: DisplaySettings;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
        );
        drawOverlays(cs);
      }
    }
  }, [points, width, height, unitOfMeasure, displaySettings]);
  return (
    <canvas
      tabIndex={0}
      ref={canvasRef}
      className={`${className} pointer-events-none`}
    />
  );
}
