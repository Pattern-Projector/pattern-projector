import React, { useEffect, useRef } from "react";

import Point from "@/_lib/point";

function mouseToCanvasPoint(e: React.MouseEvent<Element>): Point {
  return { x: e.clientX, y: e.clientY };
}

function touchToCanvasPoint(e: React.TouchEvent<Element>): Point {
  return { x: e.touches[0].clientX, y: e.touches[0].clientY };
}

/**
 * A window width and height canvas used for projector calibration
 * @param draw - Draws in the canvas rendering context
 */
export default function CalibrationCanvas({
  draw,
  className,
  handleDown,
  handleMove,
  handleUp,
}: {
  draw: (ctx: CanvasRenderingContext2D) => void;
  className: string | undefined;
  handleDown: (p: Point) => void;
  handleMove: (p: Point) => void;
  handleUp: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef !== null && canvasRef.current !== null) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx !== null) {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        draw(ctx);
      }
    }
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute cursor-crosshair z-10"
      onMouseDown={(e: React.MouseEvent) => {
        if ((e.buttons & 1) == 0) {
          handleUp();
        } else {
          handleMove(mouseToCanvasPoint(e));
        }
      }}
      onMouseMove={(e) => handleMove(mouseToCanvasPoint(e))}
      onMouseUp={() => handleUp()}
      onTouchStart={(e: React.TouchEvent) => handleDown(touchToCanvasPoint(e))}
      onTouchMove={(e: React.TouchEvent) => handleMove(touchToCanvasPoint(e))}
      onTouchEnd={() => handleUp()}
    />
  );
}
