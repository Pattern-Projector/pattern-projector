import React, { useEffect, useRef } from "react";

import { mouseToCanvasPoint, Point, touchToCanvasPoint } from "@/_lib/point";

/**
 * A window width and height canvas used for projector calibration
 * @param draw - Draws in the canvas rendering context
 */
export default function CalibrationCanvas({
  className,
  handleDown,
  handleMove,
  handleUp,
  windowScreen,
  points,
}: {
  className: string | undefined;
  handleDown: (p: Point) => void;
  handleMove: (p: Point) => void;
  handleUp: () => void;
  windowScreen: Point;
  points: Point[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maxPoints = 4; // One point per vertex in rectangle
  const radius = 30;

  function draw(
    ctx: CanvasRenderingContext2D,
    windowScreen: Point,
    points: Point[]
  ): void {
    ctx.strokeStyle = "#ffffff";
    const dy = windowScreen.y + window.outerHeight - window.innerHeight;
    const dx = windowScreen.x + window.outerWidth - window.innerWidth;
    ctx.translate(-dx, -dy);

    let prev = points[0];
    let start = Math.PI / 2; // Adds 3/4 circle around nodes to show which corners they belong in
    for (let point of points) {
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(
        point.x,
        point.y,
        radius + 5,
        start,
        start + Math.PI + Math.PI / 2
      );
      ctx.stroke();
      prev = point;
      start += Math.PI / 2;
    }

    if (points.length === maxPoints) {
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(points[0].x, points[0].y);
      ctx.stroke();
    }
  }

  useEffect(() => {
    if (canvasRef !== null && canvasRef.current !== null) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx !== null) {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        draw(ctx, windowScreen, points);
      }
    }
  }, [windowScreen, points]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      onMouseMove={(e: React.MouseEvent) => {
        if ((e.buttons & 1) == 0) {
          handleUp();
        } else {
          handleMove(mouseToCanvasPoint(e));
        }
      }}
      onMouseDown={(e) => handleDown(mouseToCanvasPoint(e))}
      onMouseUp={() => handleUp()}
      onTouchStart={(e: React.TouchEvent) => handleDown(touchToCanvasPoint(e))}
      onTouchMove={(e: React.TouchEvent) => handleMove(touchToCanvasPoint(e))}
      onTouchEnd={() => handleUp()}
    />
  );
}
