import React, { useEffect, useRef } from "react";

/**
 * A window width and height canvas used for projector calibration
 * @param draw - Draws in the canvas rendering context
 */
export default function CalibrationCanvas({
  draw = (ctx: CanvasRenderingContext2D) => {},
  ...rest
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef !== null && canvasRef.current !== null) {
      const canvas: HTMLCanvasElement = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx !== null) {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        draw(ctx);
      }
    }
  }, [draw]);

  return <canvas className="cursor-crosshair" ref={canvasRef} {...rest} />;
}
