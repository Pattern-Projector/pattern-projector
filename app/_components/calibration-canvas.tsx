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

function createCheckerboardPattern(
  ctx: CanvasRenderingContext2D,
  size: int = 3,
  color1: string = "black",
  color2: string = "#CCC"
  ): CanvasPattern {
  /* We first create a new canvas on which to draw the pattern */
  const patternCanvas = document.createElement('canvas');
  const patternCtx = patternCanvas.getContext('2d');

  if (!patternCtx) {
    throw new Error('Failed to get 2D context from pattern canvas');
  }

  /* Integer which defines the size of the checkboard 'pixel' */

  patternCanvas.width = size*2;
  patternCanvas.height = size*2;

  /* Draw the checkerboard pattern */
  patternCtx.fillStyle = color1;
  patternCtx.fillRect(0, 0, size, size);
  patternCtx.fillRect(size, size, size, size);
  patternCtx.fillStyle = color2;
  patternCtx.fillRect(size, 0, size, size);
  patternCtx.fillRect(0, size, size, size);

  /* Create the pattern from the canvas */
  const pattern = ctx.createPattern(patternCanvas, 'repeat');

  if (!pattern) {
    throw new Error('Failed to create pattern from canvas');
  }

  return pattern;
}

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
  errorFillPattern: CanvasPattern,
  displayAllCorners?: boolean,
): void {
  let isConcave = checkIsConcave(points);

  if (isCalibrating) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  ctx.translate(offset.x, offset.y);

  if (isConcave) {
    ctx.fillStyle = errorFillPattern;
  } else {
    ctx.fillStyle = "#000";
  }
  drawPolygon(ctx, points);

  if (isCalibrating) {
    ctx.fill();
  } else {
    drawBorder(ctx);
  }

  ctx.strokeStyle = "#000";
  ctx.globalCompositeOperation = "difference";
  ctx.beginPath();

  if (isCalibrating) {
    ctx.strokeStyle = "#fff";
    
    /* Only draw the grid if the polygon is convex */
    if (!isConcave) 
      drawGrid(ctx, width, height, perspective, 0, ptDensity, isCalibrating);

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
  } else if (!isConcave) {
    /* Only draw the grid if the polygon is convex */
    ctx.setLineDash([1]);
    drawGrid(ctx, width, height, perspective, 8, ptDensity, isCalibrating);
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
  isCalibrating: boolean,
): void {
  ctx.globalCompositeOperation = "source-over";
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
  if (isCalibrating) {
    drawDimensionLabels(ctx, width, height, perspective, ptDensity);
  }
}

function drawDimensionLabels(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  perspective: Matrix,
  ptDensity: number,
) {
  const fontSize = 72;
  const inset = 20;
  ctx.globalCompositeOperation = "difference";
  ctx.font = `${fontSize}px monospace`;
  ctx.fillStyle = "white";
  const widthText = `${width}`;
  const heightText = `${height}`;
  const line = transformPoints(
    [
      {
        x: width * ptDensity * 0.5,
        y: height * ptDensity,
      },
      {
        x: 0,
        y: height * 0.5 * ptDensity,
      },
    ],
    perspective,
  );
  const widthLabelWidth = ctx.measureText(widthText).width;
  ctx.fillText(widthText, line[0].x - widthLabelWidth * 0.5, line[0].y - inset);
  ctx.fillText(heightText, line[1].x + inset, line[1].y + fontSize * 0.5);
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

/* Returns true if the list of points define a concave polygon, false otherwise */
function checkIsConcave(points: Point[]): boolean {
  const n = points.length;
  if (n < 4) {
    return false; // A polygon with less than 4 points is always convex
  }

  let prevOrientation = 0;
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    const orientation = getOrientation(p1, p2, p3);
    if (orientation !== 0) {
      if (prevOrientation === 0) {
        prevOrientation = orientation;
      } else if (orientation !== prevOrientation) {
        return true; // The polygon is concave
      }
    }
  }

  return false; // The polygon is convex
}

function getOrientation(p1: Point, p2: Point, p3: Point): number {
  const crossProduct = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
  if (crossProduct < 0) {
    return -1; // Clockwise orientation
  } else if (crossProduct > 0) {
    return 1; // Counterclockwise orientation
  } else {
    return 0; // Collinear points
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
  width: number;
  height: number;
  isCalibrating: boolean;
  ptDensity: number;
  transformSettings: TransformSettings;
  setTransformSettings: Dispatch<SetStateAction<TransformSettings>>;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const patternRef = useRef<CanvasPattern | null>(null);
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

  useEffect(() => {
    setLocalPoints(points)
  }, [points, setLocalPoints])

  useEffect(() => {
    if (isPrecisionMovement && pointToModify !== null && localPoints.length > pointToModify)
	  setPrecisionActivationPoint(prevPoint => localPoints[pointToModify]);
  }, [isPrecisionMovement, pointToModify]);

  /* Used to create the fill pattern */
  useEffect(() => {
    if (!canvasRef === null || canvasRef.current === null)
      return;
    const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        patternRef.current = createCheckerboardPattern(ctx);
      }
  }, []);

  useEffect(() => {
    if (canvasRef !== null && canvasRef.current !== null
        && patternRef !== null && patternRef.current !== null
        && localPoints && localPoints.length === maxPoints) {
      let perspective_mtx = getPerspectiveTransform(getDstVertices(), localPoints);
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
          perspective_mtx,
          isCalibrating,
          pointToModify,
          ptDensity,
          isPrecisionMovement,
          patternRef.current,
          transformSettings.isFourCorners,
        );
      }
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
  }, [
    dragOffset,
    localPoints,
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
    /* Nothing to do. This short circuit is required to prevent setting
     * the localStorage of the points to invalid values */
    if (panStart === null && dragStartPoint === null)
      return;

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
