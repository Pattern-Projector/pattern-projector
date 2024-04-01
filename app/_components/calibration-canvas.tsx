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
  CanvasState,
  drawPolygon,
  drawOverlays,
  drawGrid,
} from "@/_lib/drawing";
import { getPerspectiveTransformFromPoints } from "@/_lib/geometry";
import { minIndex, sqrdist } from "@/_lib/geometry";
import { Point } from "@/_lib/point";
import { DisplaySettings } from "@/_lib/display-settings";
import { CornerColorHex } from "@/_components/theme/colors";
import useProgArrowKeyPoints from "@/_hooks/useProgArrowKeyPoints";
import { useKeyDown } from "@/_hooks/use-key-down";
import { KeyCode } from "@/_lib/key-code";

const maxPoints = 4; // One point per vertex in rectangle
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
    drawPolygon(ctx, cs.points, cs.fillColor, cs.gridLineColor);
  }

  /* Only draw the grid if the polygon is convex */
  if (!cs.isConcave) {
    drawGrid(cs, 0);
  }

  ctx.globalCompositeOperation = "difference";

  cs.points.forEach((point, index) => {
    ctx.beginPath();
    ctx.strokeStyle = getStrokeStyle(index);
    let r = cs.corners.has(index) ? 20 : 10;
    ctx.arc(point.x, point.y, r, 0, 2 * Math.PI);
    ctx.lineWidth = 4;
    ctx.stroke();
  });
}

function draw(cs: CanvasState): void {
  const ctx = cs.ctx;

  /* Calculate canvas state colors */
  cs.lightColor = "#fff";
  cs.darkColor = "#000";
  cs.greenColor = "#32CD32";
  /* Light color (in light mode) */
  cs.bgColor = interpolateColorRing(
    [cs.lightColor, cs.darkColor, cs.darkColor],
    cs.transitionProgress,
  );
  /* Dark color (in light mode) */
  cs.fillColor = interpolateColorRing(
    [cs.lightColor, cs.darkColor, cs.darkColor],
    cs.transitionProgress,
  );
  /* Grid line color */
  cs.gridLineColor = interpolateColorRing(
    [cs.darkColor, cs.greenColor, cs.lightColor],
    cs.transitionProgress,
  );
  /* Grid line color for projection mode */
  cs.projectionGridLineColor = interpolateColorRing(
    [cs.darkColor, cs.greenColor, cs.lightColor],
    cs.transitionProgress,
  );

  /* Draw background only in calibration mode */
  if (cs.isCalibrating) {
    ctx.fillStyle = cs.bgColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  if (cs.isCalibrating) {
    drawCalibration(cs);
  } else if (cs.isConcave) {
    /* If the perspective is invalid, just draw the error
     * fill pattern */
    drawPolygon(ctx, cs.points, cs.errorFillPattern);
  } else {
    /* Draw projection page */
    if (!cs.displaySettings.overlay.disabled) {
      drawOverlays(cs);
    }
  }
}

const CORNER_MARGIN = 150;

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
  const patternRef = useRef<CanvasPattern | null>(null);
  const prevColorModeRef = useRef<number | null>(null);

  const [dragPoint, setDragPoint] = useState<Point | null>(null);
  const [localPoints, setLocalPoints] = useState<Point[]>(points);
  const [corners, setCorners] = useState<Set<number>>(new Set());

  /* transitionProgress ranges from 0 to number of colorMode states + 1 */
  const [transitionProgress, setTransitionProgress] = useState<number>(0);
  const [colorMode, setColorMode] = useState<number | null>(null);

  const minColorMode = 0;
  const maxColorMode = 2;

  useEffect(() => {
    var _colorMode;
    /* The order is important here. The colorModes should monotonically
     * increase each time it changes */
    if (displaySettings.inverted && displaySettings.isInvertedGreen) {
      _colorMode = 1;
    } else if (displaySettings.inverted) {
      _colorMode = 2;
    } else {
      _colorMode = 0;
    }

    setColorMode(_colorMode);
    /* Initialize prevColorModeRef if needed */
    if (prevColorModeRef.current == null) prevColorModeRef.current = _colorMode;
  }, [displaySettings]);

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
    if (colorMode == minColorMode) {
      endTransitionProgress = maxColorMode + 1;
    }
    const transitionDistance = endTransitionProgress - startTransitionProgress;

    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      /* progress is a number between 0 and 1 */
      const progress = Math.min(elapsedTime / duration, 1);
      let newTransitionProgress =
        startTransitionProgress + progress * transitionDistance;
      /* Keep transitionProgress in the range
       * 0 (inclusive) to maxColorMode + 1 (exclusive) */
      newTransitionProgress %= maxColorMode + 1;
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
          false,
          patternRef.current,
          transitionProgress,
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
    transitionProgress,
    displaySettings,
  ]);

  function getNearbyCorner(p: Point): number {
    const distances = localPoints.map((a) => sqrdist(a, p));
    const corner = minIndex(distances);
    if (CORNER_MARGIN * CORNER_MARGIN > distances[corner]) {
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
