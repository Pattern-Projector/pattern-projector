import Matrix from "ml-matrix";
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { getPerspectiveTransform } from "@/_lib/geometry";
import { interp, minIndex, sqrdist, transformPoints } from "@/_lib/geometry";
import {
  applyOffset,
  mouseToCanvasPoint,
  Point,
  touchToCanvasPoint,
} from "@/_lib/point";
import { TransformSettings } from "@/_lib/transform-settings";
import { CornerColorHex } from "@/_components/theme/colors";
import useProgArrowKeyPoints from "@/_hooks/useProgArrowKeyPoints";

const maxPoints = 4; // One point per vertex in rectangle
const PRECISION_MOVEMENT_THRESHOLD = 15;
const PRECISION_MOVEMENT_RATIO = 5;
const PRECISION_MOVEMENT_DELAY = 500;

function getStrokeStyle(pointToModify: number) {
  return [
    CornerColorHex.TOPLEFT,
    CornerColorHex.TOPRIGHT,
    CornerColorHex.BOTTOMRIGHT,
    CornerColorHex.BOTTOMLEFT,
  ][pointToModify % 4];
}

function draw(
  ctx: CanvasRenderingContext2D,
  offset: Point,
  points: Point[],
  width: number,
  height: number,
  perspective: Matrix,
  isCalibrating: boolean,
  pointToModify: number | null,
  ptDensity: number,
  isPrecisionMovement: boolean,
  displayAllCorners?: boolean,
): void {
  ctx.translate(offset.x, offset.y);

  ctx.fillStyle = "#000";

  drawPolygon(ctx, points);
  if (isCalibrating) {
    ctx.fill();
  } else {
    drawBorder(ctx);
  }

  ctx.strokeStyle = "#000";
  ctx.beginPath();
  if (isCalibrating) {
    ctx.strokeStyle = "#fff";
    drawGrid(ctx, width, height, perspective, 0, ptDensity);

    if (displayAllCorners) {
      points.forEach((point, index) => {
        ctx.beginPath();
        ctx.strokeStyle = getStrokeStyle(index);
        if (index !== pointToModify) {
          ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
          ctx.lineWidth = 4;
        } else {
          if (isPrecisionMovement) {
            drawCrosshair(ctx, point, 20);
            ctx.lineWidth = 2;
          } else {
			ctx.arc(point.x, point.y, 20, 0, 2 * Math.PI);
            ctx.lineWidth = 4;
          }
        }
        ctx.stroke();
      });
    } else if (pointToModify !== null) {
      ctx.beginPath();
      ctx.arc(
        points[pointToModify].x,
        points[pointToModify].y,
        20,
        0,
        2 * Math.PI,
      );
      ctx.strokeStyle = getStrokeStyle(pointToModify);
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  } else {
    ctx.setLineDash([1]);
    drawGrid(ctx, width, height, perspective, 8, ptDensity);
  }
}

function drawBorder(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.lineDashOffset = 0;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  perspective: Matrix,
  outset: number,
  ptDensity: number,
): void {
  const majorLine = 5;

  for (let i = 0; i <= width; i++) {
    let lineWidth = 1;
    if (i % majorLine === 0 || i === width) {
      lineWidth = 2;
    }
    const line = transformPoints(
      [
        { x: i * ptDensity, y: -outset * ptDensity },
        { x: i * ptDensity, y: (height + outset) * ptDensity },
      ],
      perspective,
    );
    drawLine(ctx, line[0], line[1], lineWidth);
  }
  for (let i = 0; i <= height; i++) {
    let lineWidth = 1;
    if (i % majorLine === 0 || i === height) {
      lineWidth = 2;
    }
    // Move origin to bottom left to match cutting mat
    const y = (height - i) * ptDensity;
    const line = transformPoints(
      [
        { x: -outset * ptDensity, y: y },
        { x: (width + outset) * ptDensity, y: y },
      ],
      perspective,
    );
    drawLine(ctx, line[0], line[1], lineWidth);
  }
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  p1: Point,
  p2: Point,
  lineWidth: number = 1,
): void {
  ctx.beginPath();
  ctx.lineWidth = lineWidth;
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}

function drawCrosshair(ctx: CanvasRenderingContext2D, point: Point, size: number) {
  const halfSize = size / 2;
  ctx.beginPath();
  ctx.moveTo(point.x - halfSize, point.y);
  ctx.lineTo(point.x + halfSize, point.y);
  ctx.moveTo(point.x, point.y - halfSize);
  ctx.lineTo(point.x, point.y + halfSize);
}

function drawPolygon(ctx: CanvasRenderingContext2D, points: Point[]): void {
  const last = points.at(-1);
  if (last === undefined) {
    return;
  }
  ctx.moveTo(last.x, last.y);
  for (let p of points) {
    ctx.lineTo(p.x, p.y);
  }
}

const CORNER_MARGIN = 150;

/**
 * A window width and height canvas used for projector calibration
 * @param draw - Draws in the canvas rendering context
 */
export default function CalibrationCanvas({
  className,
  points,
  setPoints,
  pointToModify,
  setPointToModify,
  perspective,
  width,
  height,
  isCalibrating,
  ptDensity,
  transformSettings,
  setTransformSettings,
}: {
  className: string | undefined;
  points: Point[];
  setPoints: Dispatch<SetStateAction<Point[]>>;
  pointToModify: number | null;
  setPointToModify: Dispatch<SetStateAction<number | null>>;
  perspective: Matrix;
  width: number;
  height: number;
  isCalibrating: boolean;
  ptDensity: number;
  transformSettings: TransformSettings;
  setTransformSettings: Dispatch<SetStateAction<TransformSettings>>;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [cursorMode, setCursorMode] = useState<string | null>(null);
  const [isPrecisionMovement, setIsPrecisionMovement] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);
  const [dragStartMousePoint, setDragStartMousePoint] = useState<Point | null>(null);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [precisionActivationPoint, setPrecisionActivationPoint] = useState<Point | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [localPoints, setLocalPoints] = useState<Point[]>(points);
  const [localPerspective, setLocalPerspective] = useState<Matrix>(perspective);

  useEffect(() => {
    setLocalPoints(points)
  }, [points, setLocalPoints])

  useEffect(() => {
    setLocalPerspective(perspective)
  }, [perspective])

  useEffect(() => {
    if (localPoints && localPoints.length === maxPoints) {
      let n = getPerspectiveTransform(getDstVertices(), localPoints);
      setLocalPerspective(n);
    }

    function getDstVertices(): Point[] {
      const ox = 0;
      const oy = 0;
      const mx = +width * ptDensity + ox;
      const my = +height * ptDensity + oy;

      const dstVertices = [
        { x: ox, y: oy },
        { x: mx, y: oy },
        { x: mx, y: my },
        { x: ox, y: my },
      ];

      return dstVertices;
    }
  }, [localPoints, width, height, ptDensity, setLocalPerspective]);

  useEffect(() => {
    if (isPrecisionMovement && pointToModify !== null && localPoints.length > pointToModify)
	  setPrecisionActivationPoint(prevPoint => localPoints[pointToModify]);
  }, [isPrecisionMovement, pointToModify]);

  useEffect(() => {
    if (canvasRef !== null && canvasRef.current !== null) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx !== null) {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        draw(
          ctx,
          dragOffset,
          localPoints,
          width,
          height,
          localPerspective,
          isCalibrating,
          pointToModify,
          ptDensity,
          isPrecisionMovement,
          transformSettings.isFourCorners,
        );
      }
    }
  }, [
    dragOffset,
    localPoints,
    localPerspective,
    width,
    height,
    isCalibrating,
    pointToModify,
    ptDensity,
    transformSettings.isFourCorners,
    isPrecisionMovement
  ]);

  function getShortestDistance(p: Point): number {
    return localPoints
      .map((a) => Math.sqrt(sqrdist(a, p)))
      .reduce((final, a) => (!final || a < final ? a : final));
  }

  function handleDown(newPoint: Point) {
    if (localPoints.length < maxPoints) {
      setLocalPoints([...localPoints, newPoint]);
    } else {
      const shortestDist: number = getShortestDistance(newPoint);
      if (shortestDist < CORNER_MARGIN) {
        const newPointToModify = minIndex(localPoints.map((a) => sqrdist(a, newPoint)))
        setPointToModify(newPointToModify);
        setDragStartTime(Date.now());
        setDragStartMousePoint(newPoint);
        setDragStartPoint(localPoints[newPointToModify]);

      // Set a timeout to activate precision movement after the delay
      const timeoutId = setTimeout(() => {
        if (!isPrecisionMovement)
			setIsPrecisionMovement(true);
      }, PRECISION_MOVEMENT_DELAY);

      // Store the timeout ID to clear it if needed
      setTimeoutId(timeoutId);

      } else {
        setPointToModify(null);
        setPanStart(newPoint);
      }
    }
  }

  function handleMove(p: Point, filter: number) {
    if (pointToModify !== null) {
      //Check if we should active precision movement
      if (
        !isPrecisionMovement &&
        dragStartTime !== null &&
        dragStartMousePoint !== null &&
        Date.now() - dragStartTime > PRECISION_MOVEMENT_DELAY &&
		Math.sqrt(sqrdist(dragStartMousePoint, p)) < PRECISION_MOVEMENT_THRESHOLD &&
        timeoutId != null 
      ) {
        setIsPrecisionMovement(true);
        if (pointToModify !== null)
			setPrecisionActivationPoint(localPoints[pointToModify]);
      }

      if (
        !isPrecisionMovement &&
        dragStartTime !== null &&
        dragStartMousePoint !== null &&
		Math.sqrt(sqrdist(dragStartMousePoint, p)) > PRECISION_MOVEMENT_THRESHOLD &&
        timeoutId != null 
      ) {
        // Clear the timeout when the mouse is released
        // Setting timeoutId to null deactivates precision drag for the rest
        // of this drag sequence
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }


      const newPoints = [...localPoints];
      let destination = {
        x: p.x,
        y: p.y
      }
      if (dragStartMousePoint !== null && dragStartPoint !== null) 
      {
        destination = {
          x: dragStartMousePoint.x + ((p.x - dragStartMousePoint.x) / (isPrecisionMovement ? PRECISION_MOVEMENT_RATIO : 1)),
          y: dragStartMousePoint.y + ((p.y - dragStartMousePoint.y) / (isPrecisionMovement ? PRECISION_MOVEMENT_RATIO : 1))
        }
        /* The following 2 lines help to prevent the calibration point from "jumping" */
        destination.x -= (dragStartMousePoint.x - dragStartPoint.x)
        destination.y -= (dragStartMousePoint.y - dragStartPoint.y)
      }
      if (precisionActivationPoint && dragStartPoint)
      {
        /* The following 2 lines help to prevent the calibration point from "jumping" */
        destination.x += (precisionActivationPoint.x - dragStartPoint.x)
        destination.y += (precisionActivationPoint.y - dragStartPoint.y)
      }

      const offset = {
        x: (destination.x - newPoints[pointToModify].x),
        y: (destination.y - newPoints[pointToModify].y),
      };
      newPoints[pointToModify] = {
        x: newPoints[pointToModify].x + offset.x,
        y: newPoints[pointToModify].y + offset.y,
      };
      setLocalPoints(newPoints);
    } else if (panStart !== null) {
      setDragOffset({ x: p.x - panStart.x, y: p.y - panStart.y });
    }
  }

  function handleHover(p: Point) {
    const shortestDist: number = getShortestDistance(p);
    if (shortestDist < CORNER_MARGIN) {
      setCursorMode("corner");
    } else {
      setCursorMode("pan");
    }
  }

  function handleMouseUp() {
    localStorage.setItem("points", JSON.stringify(localPoints));
    if (panStart) {
      setPoints(localPoints.map((p) => applyOffset(p, dragOffset)));
      setDragOffset({ x: 0, y: 0 });
      setPanStart(null);
    } else {
        setPoints(localPoints);
    }
    setIsPrecisionMovement(false);
    setDragStartTime(null);
    setDragStartMousePoint(null);
    setDragStartPoint(null);
    setPrecisionActivationPoint(null);

    // Clear the timeout when the mouse is released
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }

  function handleTouchUp() {
    localStorage.setItem("points", JSON.stringify(localPoints));
    setPoints(localPoints);
    setPointToModify(null);
    setPanStart(null);
    setIsPrecisionMovement(false);
    setDragStartTime(null);
    setDragStartMousePoint(null);
    setDragStartPoint(null);
    setPrecisionActivationPoint(null);

    // Clear the timeout when the touch is released
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }

  const handleKeyDown = useCallback(
    function (e: React.KeyboardEvent) {
      if (e.code === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          setTransformSettings({
            ...transformSettings,
            isFourCorners: !transformSettings.isFourCorners,
          });
        } else {
          const newPointToModify =
            (pointToModify === null ? 0 : pointToModify + 1) % localPoints.length;
          setPointToModify(newPointToModify);
        }
      } else if (e.code === "Escape") {
        if (pointToModify !== null) {
          if (e.target instanceof HTMLElement) {
            e.target.blur();
          }
          setPointToModify(null);
        }
      }
    },
    [
      pointToModify,
      transformSettings,
      setPointToModify,
      localPoints.length,
      setTransformSettings,
    ],
  );

  useProgArrowKeyPoints(points, setPoints, pointToModify, isCalibrating);

  return (
    <canvas
      tabIndex={0}
      ref={canvasRef}
      className={className + " outline-none"}
      onKeyDown={handleKeyDown}
      onMouseMove={(e: React.MouseEvent) => {
        if ((e.buttons & 1) == 0) {
          handleMouseUp();
          handleHover(mouseToCanvasPoint(e));
        } else {
          handleMove(mouseToCanvasPoint(e), 1);
        }
      }}
      onMouseDown={(e) => handleDown(mouseToCanvasPoint(e))}
      onMouseUp={() => handleMouseUp()}
      onTouchStart={(e: React.TouchEvent) => handleDown(touchToCanvasPoint(e))}
      onTouchMove={(e: React.TouchEvent) =>
        handleMove(touchToCanvasPoint(e), 0.05)
      }
      onTouchEnd={() => handleTouchUp()}
      style={{
        cursor:
          cursorMode === "corner"
            ? "url('/crosshair.png') 11 11, crosshair"
            : "grab",
        pointerEvents: isCalibrating ? "auto" : "none",
      }}
    />
  );
}
