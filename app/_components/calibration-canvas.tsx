import Matrix from "ml-matrix";
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createCheckerboardPattern,
  interpolateColorRing,
  OverlayMode,
  CanvasState
} from "@/_lib/drawing";
import { getPerspectiveTransform } from "@/_lib/geometry";
import {
  minIndex,
  sqrdist,
  transformPoints,
} from "@/_lib/geometry";
import { mouseToCanvasPoint, Point, touchToCanvasPoint } from "@/_lib/point";
import { TransformSettings } from "@/_lib/transform-settings";
import { CornerColorHex } from "@/_components/theme/colors";
import useProgArrowKeyPoints from "@/_hooks/useProgArrowKeyPoints";

const maxPoints = 4; // One point per vertex in rectangle
const PRECISION_MOVEMENT_THRESHOLD = 15;
const PRECISION_MOVEMENT_RATIO = 5;
const PRECISION_MOVEMENT_DELAY = 500;
const TRANSITION_DURATION = 700;

function getStrokeStyle(pointToModify: number) {
  return [
    CornerColorHex.TOPLEFT,
    CornerColorHex.TOPRIGHT,
    CornerColorHex.BOTTOMRIGHT,
    CornerColorHex.BOTTOMLEFT,
  ][pointToModify % 4];
}

function drawCalibration(cs: CanvasState): void {
  const ctx = cs.ctx;
  ctx.globalCompositeOperation = "source-over";
  if (cs.isConcave) {
    ctx.fillStyle = cs.errorFillPattern;
    drawPolygon(ctx, cs.points, cs.errorFillPattern);
  } else {
    ctx.lineWidth = cs.majorLineWidth;
    drawPolygon(ctx, cs.points, "#000", cs.gridLineColor);
  }

  /* Only draw the grid if the polygon is convex */
  if (!cs.isConcave){
    drawGrid(cs, 0) 
  }

  ctx.globalCompositeOperation = "difference";
  if (cs.transformSettings.isFourCorners) {
    cs.points.forEach((point, index) => {
      ctx.beginPath();
      ctx.strokeStyle = getStrokeStyle(index);
      if (index !== cs.pointToModify) {
        ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
        ctx.lineWidth = 4;
      } else {
        if (cs.isPrecisionMovement) {
          drawCrosshair(ctx, point, 20);
          ctx.lineWidth = 2;
        } else {
          ctx.arc(point.x, point.y, 20, 0, 2 * Math.PI);
          ctx.lineWidth = 4;
        }
      }
      ctx.stroke();
    });
  } else if (cs.pointToModify !== null) {
    ctx.beginPath();
    ctx.arc(
      cs.points[cs.pointToModify].x,
      cs.points[cs.pointToModify].y,
      20,
      0,
      2 * Math.PI,
    );
    ctx.strokeStyle = getStrokeStyle(cs.pointToModify);
    ctx.lineWidth = 4;
    ctx.stroke();
  }
}

function draw(cs: CanvasState): void {
  const ctx = cs.ctx

  /* Calculate canvas state colors */
  const lightColor = "#fff";
  const darkColor = "#000";
  const greenColor = "#32CD32" 
  /* Light color (in light mode) */
  cs.bgColor = interpolateColorRing(
    [lightColor, darkColor, darkColor],
    cs.transitionProgress);
  /* Dark color (in light mode) */
  cs.fillColor = interpolateColorRing(
    [darkColor, lightColor, lightColor],
    cs.transitionProgress);
  /* Grid line color */
  cs.gridLineColor = interpolateColorRing(
    [lightColor, greenColor, lightColor],
    cs.transitionProgress);
  /* Grid line color for projection mode */
  cs.projectionGridLineColor = interpolateColorRing(
    [darkColor, greenColor, lightColor],
    cs.transitionProgress);

  /* Draw background only in calibration mode */
  if (cs.isCalibrating) {
    ctx.fillStyle = cs.bgColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  ctx.translate(cs.offset.x, cs.offset.y);

  if (cs.isCalibrating) {
    drawCalibration(cs);
  } else if (cs.isConcave) {
    /* If the perspective is invalid, just draw the error
     * fill pattern */
    drawPolygon(ctx, cs.points, cs.errorFillPattern);
  } else {
    switch(cs.overlayMode) {
      case OverlayMode.BORDER:
        drawBorder(cs, darkColor, cs.gridLineColor);
      break;
      case OverlayMode.GRID:
        ctx.strokeStyle = cs.projectionGridLineColor
        drawGrid(cs, 8, [1]) 
        drawBorder(cs, darkColor, cs.gridLineColor);
    }
  }
}

function drawBorder(cs: CanvasState, lineColor: string, dashColor: string) {
  const ctx = cs.ctx;
  ctx.save();
  drawPolygon(ctx, cs.points);
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.lineDashOffset = 0;
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = dashColor; 
  ctx.stroke();
  ctx.restore();
}

function drawGrid(
  cs: CanvasState,
  outset: number,
  lineDash?: number[],
): void {
  const ctx = cs.ctx;
  ctx.save();
  if (lineDash === undefined){
    ctx.setLineDash([]);
  } else {
    ctx.setLineDash(lineDash);
  }
  ctx.globalCompositeOperation = "source-over";
  const majorLine = 5;

  for (let i = 0; i <= cs.width; i++) {
    let lineWidth = cs.minorLineWidth;
    if (i % majorLine === 0 || i === cs.width) {
      lineWidth = cs.majorLineWidth;
    }
    const line = transformPoints(
      [
        { x: i * cs.ptDensity, y: -outset * cs.ptDensity },
        { x: i * cs.ptDensity, y: (cs.height + outset) * cs.ptDensity },
      ],
      cs.perspective,
    );
    drawLine(ctx, line[0], line[1], lineWidth);
  }
  for (let i = 0; i <= cs.height; i++) {
    let lineWidth = cs.minorLineWidth;
    if (i % majorLine === 0 || i === cs.height) {
      lineWidth = cs.majorLineWidth;
    }
    // Move origin to bottom left to match cutting mat
    const y = (cs.height - i) * cs.ptDensity;
    const line = transformPoints(
      [
        { x: -outset * cs.ptDensity, y: y },
        { x: (cs.width + outset) * cs.ptDensity, y: y },
      ],
      cs.perspective,
    );
    drawLine(ctx, line[0], line[1], lineWidth);
  }
  if (cs.isCalibrating) {
    drawDimensionLabels(ctx, cs.width, cs.height, cs.perspective, cs.ptDensity);
  }
  ctx.restore()
}

function drawDimensionLabels(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  perspective: Matrix,
  ptDensity: number,
) {
  ctx.save();
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
  ctx.restore();
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  p1: Point,
  p2: Point,
  lineWidth: number = 1,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.lineWidth = lineWidth;
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  ctx.restore();
}

function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  point: Point,
  size: number,
) {
  const halfSize = size / 2;
  ctx.beginPath();
  ctx.moveTo(point.x - halfSize, point.y);
  ctx.lineTo(point.x + halfSize, point.y);
  ctx.moveTo(point.x, point.y - halfSize);
  ctx.lineTo(point.x, point.y + halfSize);
}

function drawPolygon(ctx: CanvasRenderingContext2D, points: Point[], fillStyle?: string | null | CanvasPattern , strokeStyle?: string | null): void {
  ctx.beginPath();
  for (let p of points) {
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  if (fillStyle !== undefined && fillStyle !== null) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle !== undefined && strokeStyle !== null) {
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
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
  overlayMode,
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
  overlayMode: OverlayMode;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const patternRef = useRef<CanvasPattern | null>(null);
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [panStartPoints, setPanStartPoints] = useState<Point[] | null>(null);
  const [cursorMode, setCursorMode] = useState<string | null>(null);
  const [isPrecisionMovement, setIsPrecisionMovement] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<number | null>(null);
  const [dragStartMousePoint, setDragStartMousePoint] = useState<Point | null>(
    null,
  );
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [precisionActivationPoint, setPrecisionActivationPoint] =
    useState<Point | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [localPoints, setLocalPoints] = useState<Point[]>(points);
  /* transitionProgress ranges from 0 to number of colorMode states + 1 */
  const [transitionProgress, setTransitionProgress] = useState<number>(0);
  const [colorMode, setColorMode] = useState<number | null>(null);
  const prevColorModeRef = useRef<number | null>(null);

  const minColorMode = 0;
  const maxColorMode = 2;

  useEffect(() => {
    var _colorMode;
    /* The order is important here. The colorModes should monotonically 
     * increase each time it changes */
    if (transformSettings.inverted && transformSettings.isInvertedGreen) {
      _colorMode = 1;
    } else if (transformSettings.inverted) {
      _colorMode = 2;
    } else {
      _colorMode = 0;
    }

    setColorMode(_colorMode);
    /* Initialize prevColorModeRef if needed */
    if (prevColorModeRef.current == null)
      prevColorModeRef.current = _colorMode;
  },[transformSettings])

useEffect(() => {
    /* No colorMode set yet, nothing to do */
    if (colorMode == null) return;

    const prevColorMode = prevColorModeRef.current;
    prevColorModeRef.current = colorMode;

    /* No previous color mode, nothing to do */
    if (prevColorMode == null) return;
    
    /* No transition necessary (probably just initialized) */
    if (colorMode == prevColorMode) {
      setTransitionProgress(colorMode);
      return;
    } 

    let frameId: number;
    const startTime = Date.now();
    const duration = TRANSITION_DURATION;
    /* Start from our current progress (avoids jumping on double-click) */
    const startTransitionProgress = transitionProgress;
    let endTransitionProgress = colorMode;
    /* Only allow forward progression */
    if (colorMode == minColorMode){
      endTransitionProgress = maxColorMode + 1;
    }
    const transitionDistance = endTransitionProgress - startTransitionProgress;

    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      /* progress is a number between 0 and 1 */
      const progress = Math.min(elapsedTime / duration, 1);
      let newTransitionProgress = startTransitionProgress + progress * transitionDistance; 
      /* Keep transitionProgress in the range 
       * 0 (inclusive) to maxColorMode + 1 (exclusive) */
      newTransitionProgress %= maxColorMode+1; 
      setTransitionProgress(newTransitionProgress);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [colorMode]);

  useEffect(() => {
    setLocalPoints(points);
  }, [points, setLocalPoints]);

  useEffect(() => {
    if (
      isPrecisionMovement &&
      pointToModify !== null &&
      localPoints.length > pointToModify
    )
      setPrecisionActivationPoint((prevPoint) => localPoints[pointToModify]);
  }, [isPrecisionMovement, pointToModify]);

  /* Used to create the error fill pattern */
  useEffect(() => {
    if (!canvasRef === null || canvasRef.current === null) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      patternRef.current = createCheckerboardPattern(ctx, 3, "#555", "#CCC");
    }
  }, []);

  useEffect(() => {
    if (
      canvasRef !== null &&
      canvasRef.current !== null &&
      patternRef !== null &&
      patternRef.current !== null &&
      localPoints &&
      localPoints.length === maxPoints
    ) {
      let perspective_mtx = getPerspectiveTransform(
        getDstVertices(),
        localPoints,
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
          perspective_mtx,
          isCalibrating,
          pointToModify,
          ptDensity,
          isPrecisionMovement,
          patternRef.current,
          transitionProgress,
          transformSettings,
          overlayMode,
        )
        draw(cs);
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
    localPoints,
    width,
    height,
    isCalibrating,
    pointToModify,
    ptDensity,
    transitionProgress,
    transformSettings,
    isPrecisionMovement,
    overlayMode
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
        const newPointToModify = minIndex(
          localPoints.map((a) => sqrdist(a, newPoint)),
        );
        setPointToModify(newPointToModify);
        setDragStartTime(Date.now());
        setDragStartMousePoint(newPoint);
        setDragStartPoint(localPoints[newPointToModify]);

        // Set a timeout to activate precision movement after the delay
        const timeoutId = setTimeout(() => {
          if (!isPrecisionMovement) setIsPrecisionMovement(true);
        }, PRECISION_MOVEMENT_DELAY);

        // Store the timeout ID to clear it if needed
        setTimeoutId(timeoutId);
      } else {
        setPointToModify(null);
        setPanStart(newPoint);
        setPanStartPoints(localPoints);
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
        Math.sqrt(sqrdist(dragStartMousePoint, p)) <
          PRECISION_MOVEMENT_THRESHOLD &&
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
        Math.sqrt(sqrdist(dragStartMousePoint, p)) >
          PRECISION_MOVEMENT_THRESHOLD &&
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
        y: p.y,
      };
      if (dragStartMousePoint !== null && dragStartPoint !== null) {
        destination = {
          x:
            dragStartMousePoint.x +
            (p.x - dragStartMousePoint.x) /
              (isPrecisionMovement ? PRECISION_MOVEMENT_RATIO : 1),
          y:
            dragStartMousePoint.y +
            (p.y - dragStartMousePoint.y) /
              (isPrecisionMovement ? PRECISION_MOVEMENT_RATIO : 1),
        };
        /* The following 2 lines help to prevent the calibration point from "jumping" */
        destination.x -= dragStartMousePoint.x - dragStartPoint.x;
        destination.y -= dragStartMousePoint.y - dragStartPoint.y;
      }
      if (precisionActivationPoint && dragStartPoint) {
        /* The following 2 lines help to prevent the calibration point from "jumping" */
        destination.x += precisionActivationPoint.x - dragStartPoint.x;
        destination.y += precisionActivationPoint.y - dragStartPoint.y;
      }

      const offset = {
        x: destination.x - newPoints[pointToModify].x,
        y: destination.y - newPoints[pointToModify].y,
      };
      newPoints[pointToModify] = {
        x: newPoints[pointToModify].x + offset.x,
        y: newPoints[pointToModify].y + offset.y,
      };
      setLocalPoints(newPoints);
    } else if (
      panStart !== null &&
      panStartPoints !== null &&
      panStartPoints.length === maxPoints
    ) {
      /* Panning. Apply the offset to the panStartPoints */
      const dragOffset = { x: p.x - panStart.x, y: p.y - panStart.y };
      setPoints(
        panStartPoints.map((p) => {
          return { x: p.x + dragOffset.x, y: p.y + dragOffset.y };
        }),
      );
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
    if (panStart === null && dragStartPoint === null) return;

    localStorage.setItem("points", JSON.stringify(localPoints));
    if (panStart) {
      setPanStart(null);
      setPanStartPoints(null);
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
    /* Nothing to do. This short circuit is required to prevent setting
     * the localStorage of the points to invalid values */
    if (panStart === null && dragStartPoint === null) return;

    localStorage.setItem("points", JSON.stringify(localPoints));
    setPoints(localPoints);
    setPointToModify(null);
    setPanStart(null);
    setPanStartPoints(null);
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
            (pointToModify === null ? 0 : pointToModify + 1) %
            localPoints.length;
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
