import { constrained, dist, distToLine, transformPoint } from "@/_lib/geometry";
import { CSS_PIXELS_PER_INCH } from "@/_lib/pixels-per-inch";
import { Point } from "@/_lib/point";
import Matrix, { inverse } from "ml-matrix";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { drawLine, drawArrow } from "@/_lib/drawing";
import { useTransformContext } from "@/_hooks/use-transform-context";

import { KeyCode } from "@/_lib/key-code";
import LineMenu from "@/_components/menus/line-menu";
import { useKeyDown } from "@/_hooks/use-key-down";
import { useKeyUp } from "@/_hooks/use-key-up";
import { Unit } from "@/_lib/unit";
import { MenuStates } from "@/_lib/menu-states";
import linesReducer, {
  Line,
  createLine,
  transformLine,
} from "@/_reducers/linesReducer";

export default function MeasureCanvas({
  perspective,
  calibrationTransform,
  unitOfMeasure,
  className,
  measuring,
  setMeasuring,
  file,
  gridCenter,
  zoomedOut,
  magnifying,
  menusHidden,
  menuStates,
  isDarkTheme,
  children,
}: {
  perspective: Matrix;
  calibrationTransform: Matrix;
  unitOfMeasure: Unit;
  className?: string;
  measuring: boolean;
  setMeasuring: Dispatch<SetStateAction<boolean>>;
  file: File | null;
  gridCenter: Point;
  zoomedOut: boolean;
  magnifying: boolean;
  menusHidden: boolean;
  menuStates: MenuStates;
  isDarkTheme: boolean;
  children: React.ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragOffset = useRef<Point | null>(null);

  const [selectedLine, setSelectedLine] = useState<number>(-1);
  const [lines, dispatchLines] = useReducer(linesReducer, []);
  const [axisConstrained, setAxisConstrained] = useState<boolean>(false);

  const transform = useTransformContext();

  const disablePointer = measuring || dragOffset.current;

  // Use a consistent physical size for the touch area (1/2 inch).
  const TOUCH_AREA_INCHES = 0.5;
  const END_CIRCLE_RADIUS = CSS_PIXELS_PER_INCH * TOUCH_AREA_INCHES;
  const LINE_TOUCH_RADIUS = CSS_PIXELS_PER_INCH * 0.5; // A slightly larger area for the line itself

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const client = { x: e.clientX, y: e.clientY };
    const patternToClient = calibrationTransform.mmul(transform);

    const scale = Math.sqrt(
      transform.get(0, 0) ** 2 + transform.get(0, 1) ** 2,
    );
    const scaledEndCircleRadius = END_CIRCLE_RADIUS / scale;
    const scaledLineTouchRadius = LINE_TOUCH_RADIUS / scale;

    let lineToSelect = -1;

    for (let i = 0; i < lines.length; i++) {
      const patternLine = lines[i];
      const clientLine = transformLine(patternLine, patternToClient);
      // Start dragging one end of the selected line?
      for (const end of [0, 1]) {
        const clientEnd = clientLine.points[end];
        const d = dist(clientEnd, client);
        if (d < scaledEndCircleRadius) {
          setSelectedLine(i);
          dragOffset.current = {
            x: clientEnd.x - client.x,
            y: clientEnd.y - client.y,
          };
          if (end === 0) {
            // Swap to always drag the end.
            dispatchLines({
              type: "update-both-points",
              index: i,
              newP0: patternLine.points[1],
              newP1: patternLine.points[0],
            });
          }
          e.stopPropagation();
          return;
        }
      }

      const dToLine = distToLine(clientLine.points, client);
      if (dToLine < scaledLineTouchRadius) {
        lineToSelect = i;
      }
    }

    if (lineToSelect !== -1) {
      setSelectedLine(lineToSelect === selectedLine ? -1 : lineToSelect);
      dragOffset.current = null;
      e.stopPropagation();
      return;
    }

    // Nothing selected.
    setSelectedLine(-1);
    dragOffset.current = null;

    if (!measuring) {
      return;
    }

    // Create a new line and start dragging its end.
    const pattern = transformPoint(client, inverse(patternToClient));
    dispatchLines({
      type: "add",
      line: createLine(pattern, pattern, unitOfMeasure),
    });
    setSelectedLine(lines.length);
    dragOffset.current = {
      x: 0,
      y: 0,
    };
    e.stopPropagation();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.buttons === 0 && dragOffset.current) {
      e.stopPropagation();
      // If the mouse button is released, end the drag.
      dragOffset.current = null;
      return;
    }

    // Dragging an end of a line?
    if (selectedLine >= 0 && dragOffset.current) {
      e.stopPropagation();
      const client = { x: e.clientX, y: e.clientY };
      const clientDestination = {
        x: client.x + dragOffset.current.x,
        y: client.y + dragOffset.current.y,
      };

      const matLine = transformLine(lines[selectedLine], transform);
      let matFinal = transformPoint(clientDestination, perspective);
      if (axisConstrained) {
        matFinal = constrained(matFinal, matLine.points[0]);
      }
      const patternDestination = transformPoint(matFinal, inverse(transform));

      dispatchLines({
        type: "update-point",
        index: selectedLine,
        pointIndex: 1, // Always dragging the second point
        newPoint: patternDestination,
        isConstrained: axisConstrained,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!dragOffset.current) {
      return;
    }

    const client = {
      x: e.clientX + dragOffset.current.x,
      y: e.clientY + dragOffset.current.y,
    };

    dragOffset.current = null;

    e.stopPropagation();
    const patternLine = lines[selectedLine];
    const patternAnchor = patternLine.points[0];
    const matAnchor = transformPoint(patternAnchor, transform);
    const destMat = transformPoint(client, perspective);
    let matFinal = destMat;
    if (axisConstrained) {
      matFinal = constrained(destMat, matAnchor);
    }
    // If it's too small, drop a reasonable size line instead.
    if (dist(matFinal, matAnchor) < CSS_PIXELS_PER_INCH / 16) {
      matFinal = { x: matAnchor.x + CSS_PIXELS_PER_INCH, y: matAnchor.y };
    }
    const patternFinal = transformPoint(matFinal, inverse(transform));
    if (!zoomedOut) {
      setMeasuring(false);
    }
    dispatchLines({
      type: "update-point",
      index: selectedLine,
      pointIndex: 1,
      newPoint: patternFinal,
      isConstrained: axisConstrained,
    });
  };

  function handleDeleteLine() {
    if (selectedLine >= 0) {
      dispatchLines({ type: "remove", index: selectedLine });
      if (selectedLine === 0) {
        setSelectedLine(lines.length - 2);
      } else {
        setSelectedLine(selectedLine - 1);
      }
    }
  }

  useEffect(() => {
    if (measuring && selectedLine < 0 && lines.length > 0) {
      setSelectedLine(0);
    }
  }, [measuring, lines.length, selectedLine]);

  useKeyDown(() => {
    setAxisConstrained(true);
  }, [KeyCode.Shift]);

  useKeyUp(() => {
    setAxisConstrained(false);
  }, [KeyCode.Shift]);

  useEffect(() => {
    dispatchLines({
      type: "update-unit-of-measure",
      unitOfMeasure,
    });
  }, [unitOfMeasure]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        ctx.strokeStyle = "#FF4500";

        ctx.lineWidth = 4;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const patternToClient = calibrationTransform.mmul(transform);
        for (let i = 0; i < lines.length; i++) {
          if (i !== selectedLine) {
            drawLine(ctx, transformLine(lines[i], patternToClient).points);
          }
        }
        if (lines.length > 0 && selectedLine >= 0) {
          // Style selected line differently.
          ctx.strokeStyle = "#9333ea";

          const patternLine = lines[selectedLine];
          const matLine = transformLine(patternLine, transform);
          if (axisConstrained && dragOffset.current) {
            matLine.points[1] = constrained(
              matLine.points[1],
              matLine.points[0],
            );
          }
          const clientLine = transformLine(
            matLine,
            calibrationTransform,
          ).points;
          drawArrow(ctx, clientLine);
          drawMeasurementsAt(ctx, matLine, clientLine[1]);
        }
      }
    }

    function drawMeasurementsAt(
      ctx: CanvasRenderingContext2D,
      line: Line,
      p1: Point,
    ) {
      ctx.save();
      ctx.font = "24px sans-serif";
      ctx.strokeStyle = isDarkTheme ? "#000" : "#fff";
      ctx.fillStyle = isDarkTheme ? "#fff" : "#000";
      const text = `${magnifying ? Number(line.distance) / 5 : line.distance}${line.unitOfMeasure.toLocaleLowerCase()} ${line.angle}°`; // When magnifying, show the input distance (1/5 scale)
      ctx.lineWidth = 4;
      const location = { x: p1.x, y: p1.y - END_CIRCLE_RADIUS - 8 };
      ctx.strokeText(text, location.x, location.y);
      ctx.fillText(text, location.x, location.y);
      ctx.restore();
    }
  }, [
    perspective,
    unitOfMeasure,
    axisConstrained,
    calibrationTransform,
    lines,
    transform,
    selectedLine,
    measuring,
    isDarkTheme,
  ]);

  useEffect(() => {
    dispatchLines({ type: "reset" });
    setSelectedLine(-1);
  }, [file]);

  useEffect(() => {
    if (zoomedOut || magnifying) {
      setMeasuring(false);
      setSelectedLine(-1);
    }
  }, [zoomedOut, magnifying, setMeasuring]);

  return (
    <div className={className}>
      <div
        onPointerDownCapture={handlePointerDown}
        onPointerMoveCapture={handlePointerMove}
        onPointerUpCapture={handlePointerUp}
        className={`${measuring ? "cursor-crosshair" : ""} h-screen w-screen`}
      >
        <div className={`${disablePointer ? "pointer-events-none" : ""}`}>
          {children}
        </div>
        <canvas
          ref={canvasRef}
          className={`absolute top-0 inset-0 w-full h-full pointer-events-none`}
        ></canvas>
      </div>
      <LineMenu
        selectedLine={selectedLine}
        setSelectedLine={setSelectedLine}
        lines={lines}
        dispatchLines={dispatchLines}
        handleDeleteLine={handleDeleteLine}
        gridCenter={gridCenter}
        setMeasuring={setMeasuring}
        menusHidden={menusHidden}
        menuStates={menuStates}
        unitOfMeasure={unitOfMeasure}
      />
    </div>
  );
}
