import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  CanvasState,
  drawPolygon,
  drawOverlays,
  drawGrid,
  drawCalibrationPoints,
} from "@/_lib/drawing";
import { getPerspectiveTransformFromPoints } from "@/_lib/geometry";
import { minIndex, sqrDist } from "@/_lib/geometry";
import { Point } from "@/_lib/point";
import { DisplaySettings, strokeColor } from "@/_lib/display-settings";
import useProgArrowKeyPoints from "@/_hooks/useProgArrowKeyPoints";
import { useKeyDown } from "@/_hooks/use-key-down";
import { KeyCode } from "@/_lib/key-code";

const maxPoints = 4; // One point per vertex in rectangle
const majorLineWidth = 4;
const cornerMargin = 150;

export default function CalibrationCanvas({
  className,
  points,
  setPoints,
  width,
  height,
  isCalibrating,
  unitOfMeasure,
  displaySettings,
}: {
  className: string | undefined;
  points: Point[];
  setPoints: Dispatch<SetStateAction<Point[]>>;
  width: number;
  height: number;
  isCalibrating: boolean;
  unitOfMeasure: string;
  displaySettings: DisplaySettings;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dragPoint, setDragPoint] = useState<Point | null>(null);
  const [localPoints, setLocalPoints] = useState<Point[]>(points);
  const [corners, setCorners] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLocalPoints(points);
  }, [points, setLocalPoints]);

  useEffect(() => {
    if (
      canvasRef !== null &&
      canvasRef.current !== null &&
      localPoints &&
      localPoints.length === maxPoints
    ) {
      /* All drawing is done in unitsOfMeasure, ptDensity = 1.0 */
      let perspectiveMatrix = getPerspectiveTransformFromPoints(
        localPoints,
        width,
        height,
        1.0,
        false,
      );

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx !== null) {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        let cs = new CanvasState(
          ctx,
          { x: 0, y: 0 },
          localPoints,
          width,
          height,
          perspectiveMatrix,
          isCalibrating,
          corners,
          unitOfMeasure,
          strokeColor(displaySettings.theme),
          displaySettings,
        );
        draw(cs);
      }
    }
  }, [
    localPoints,
    width,
    height,
    isCalibrating,
    corners,
    unitOfMeasure,
    displaySettings,
  ]);

  function getNearbyCorner(p: Point): number {
    const distances = localPoints.map((a) => sqrDist(a, p));
    const corner = minIndex(distances);
    if (cornerMargin ** 2 > distances[corner]) {
      return corner;
    }
    return -1;
  }

  const handleKeyDown = useCallback(
    function (e: React.KeyboardEvent) {
      if (e.code === "Escape") {
        if (corners.size) {
          if (e.target instanceof HTMLElement) {
            e.target.blur();
          }
          setCorners(new Set());
        }
      }
    },
    [corners, setCorners],
  );

  useKeyDown(() => {
    if (corners.size) {
      setCorners(new Set(Array.from(corners).map((c) => (c + 1) % 4)));
    } else {
      setCorners(new Set([0]));
    }
  }, [KeyCode.Tab]);

  useProgArrowKeyPoints(points, setPoints, corners, isCalibrating);

  function handlePointerDown(e: React.PointerEvent) {
    const p = { x: e.clientX, y: e.clientY };
    if (localPoints.length < maxPoints) {
      setLocalPoints([...localPoints, p]);
    } else {
      const corner = getNearbyCorner(p);
      if (corner !== -1) {
        setDragPoint(p);
        setCorners(new Set([corner]));
      } else {
        setCorners(new Set());
      }
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (corners.size == 0 || dragPoint == null) return;
    const p = { x: e.clientX, y: e.clientY };
    const newPoints = [...localPoints];
    for (let corner of corners) {
      const currentPoint = newPoints[corner];
      newPoints[corner] = {
        x: currentPoint.x + (p.x - dragPoint.x),
        y: currentPoint.y + (p.y - dragPoint.y),
      };
    }
    setDragPoint(p);
    setLocalPoints(newPoints);
  }

  function handlePointerUp() {
    /* Nothing to do. This short circuit is required to prevent setting
     * the localStorage of the points to invalid values */
    if (dragPoint === null) return;

    localStorage.setItem("points", JSON.stringify(localPoints));
    setPoints(localPoints);
    setDragPoint(null);
  }

  return (
    <canvas
      tabIndex={0}
      ref={canvasRef}
      className={`${className} outline-none`}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        pointerEvents: isCalibrating ? "auto" : "none",
      }}
    />
  );
}

function draw(cs: CanvasState): void {
  const { ctx, isCalibrating, displaySettings } = cs;

  if (isCalibrating) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawCalibration(cs);
  } else if (cs.isConcave) {
    ctx.fillStyle = cs.errorFillPattern;
    drawPolygon(ctx, cs.points);
    ctx.fill();
  } else {
    /* Draw projection page */
    if (!displaySettings.overlay.disabled) {
      drawOverlays(cs);
    }
  }
}

function drawCalibration(cs: CanvasState): void {
  const { ctx, points, errorFillPattern, isConcave } = cs;
  if (isConcave) {
    ctx.fillStyle = errorFillPattern;
    drawPolygon(ctx, points);
    ctx.fill();
  } else {
    ctx.lineWidth = majorLineWidth;
    ctx.strokeStyle = strokeColor(cs.displaySettings.theme);
    drawPolygon(ctx, points);
    ctx.stroke();
    drawGrid(cs, 0);
  }

  drawCalibrationPoints(cs);
}
