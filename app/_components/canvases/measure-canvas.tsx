import {
  angleDeg,
  constrained,
  dist,
  distToLine,
  transformLine,
  transformPoint,
} from "@/_lib/geometry";
import { CSS_PIXELS_PER_INCH } from "@/_lib/pixels-per-inch";
import { Point } from "@/_lib/point";
import Matrix, { inverse } from "ml-matrix";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { drawLine, drawArrow } from "@/_lib/drawing";
import { useTransformContext } from "@/_hooks/use-transform-context";
import { Line } from "@/_lib/interfaces/line";

import { KeyCode } from "@/_lib/key-code";
import LineMenu from "@/_components/menus/line-menu";
import { useKeyDown } from "@/_hooks/use-key-down";
import { useKeyUp } from "@/_hooks/use-key-up";
import { CM } from "@/_lib/unit";
import { MenuStates } from "@/_lib/menu-states";

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
  children,
}: {
  perspective: Matrix;
  calibrationTransform: Matrix;
  unitOfMeasure: string;
  className?: string;
  measuring: boolean;
  setMeasuring: Dispatch<SetStateAction<boolean>>;
  file: File | null;
  gridCenter: Point;
  zoomedOut: boolean;
  magnifying: boolean;
  menusHidden: boolean;
  menuStates: MenuStates;
  children: React.ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragOffset = useRef<Point | null>(null);

  const [selectedLine, setSelectedLine] = useState<number>(-1);
  const [lines, setLines] = useState<Line[]>([]); // pattern space coordinates.
  const [axisConstrained, setAxisConstrained] = useState<boolean>(false);

  const transform = useTransformContext();

  const disablePointer = measuring || dragOffset.current;

  const endCircleRadius = 24;
  const lineTouchRadius = 48;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const client = { x: e.clientX, y: e.clientY };
    const patternToClient = calibrationTransform.mmul(transform);

    // Possibly select a line.
    for (let i = 0; i < lines.length; i++) {
      const patternLine = lines[i];
      const clientLine = transformLine(patternLine, patternToClient);
      // Start dragging one end of the selected line?
      if (selectedLine == i) {
        let minDist = lineTouchRadius;
        let minEnd = -1;
        for (const end of [0, 1]) {
          const clientEnd = clientLine[end];
          const d = dist(clientEnd, client);
          if (d < minDist) {
            minDist = d;
            dragOffset.current = {
              x: clientEnd.x - client.x,
              y: clientEnd.y - client.y,
            };
            minEnd = end;
          }
        }
        if (minEnd >= 0) {
          if (minEnd == 0) {
            // Swap to always drag the end.
            setLines(lines.toSpliced(i, 1, [patternLine[1], patternLine[0]]));
          }
          e.stopPropagation();
          return;
        }
      }

      if (distToLine(clientLine, client) < endCircleRadius) {
        // select/deselect the line.
        setSelectedLine(i == selectedLine ? -1 : i);
        e.stopPropagation();
        return;
      }
    }

    // Nothing selected.
    setSelectedLine(-1);
    dragOffset.current = null;

    if (!measuring) {
      return;
    }

    // Create a new line and start dragging its end.
    const pattern = transformPoint(client, inverse(patternToClient));
    setLines([...lines, [pattern, pattern]]);
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
      const clientToPattern = inverse(transform).mmul(perspective);
      const patternDestination = transformPoint(
        clientDestination,
        clientToPattern,
      );
      const patternLine = lines[selectedLine];
      patternLine[1] = patternDestination;
      setLines(lines.toSpliced(selectedLine, 1, patternLine));
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
    // finish the line.
    const patternLine = lines[selectedLine];
    const patternAnchor = patternLine[0];
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
    patternLine[1] = patternFinal;
    setLines(lines.toSpliced(selectedLine, 1, patternLine));
  };

  function handleDeleteLine() {
    if (selectedLine >= 0) {
      setLines(lines.toSpliced(selectedLine, 1));
      if (selectedLine == 0) {
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
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        ctx.strokeStyle = "#9333ea";

        ctx.lineWidth = 4;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const patternToClient = calibrationTransform.mmul(transform);
        for (let i = 0; i < lines.length; i++) {
          if (i !== selectedLine) {
            drawLine(ctx, transformLine(lines[i], patternToClient));
          }
        }
        if (lines.length > 0 && selectedLine >= 0) {
          const patternLine = lines[selectedLine];
          const matLine = transformLine(patternLine, transform);
          if (axisConstrained && dragOffset.current) {
            matLine[1] = constrained(matLine[1], matLine[0]);
          }
          const clientLine = transformLine(matLine, calibrationTransform);
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
      ctx.strokeStyle = "#fff";
      ctx.fillStyle = "#000";
      const text = measurementsString(line, unitOfMeasure);
      ctx.lineWidth = 4;
      const location = { x: p1.x, y: p1.y - endCircleRadius - 8 };
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
  ]);

  useEffect(() => {
    setLines([]);
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
        setLines={setLines}
        handleDeleteLine={handleDeleteLine}
        gridCenter={gridCenter}
        setMeasuring={setMeasuring}
        menusHidden={menusHidden}
        menuStates={menuStates}
      />
    </div>
  );
}
function measurementsString(line: Line, unitOfMeasure: string): string {
  let a = -angleDeg(line);
  if (a < 0) {
    a += 360;
  }
  let label = a.toFixed(0);
  if (label == "360") {
    label = "0";
  }
  const d = distanceString(line, unitOfMeasure);
  return `${d} ${label}°`;
}

function distanceString(line: Line, unitOfMeasure: string): string {
  let d = dist(...line) / CSS_PIXELS_PER_INCH;
  if (unitOfMeasure == CM) {
    d *= 2.54;
  }
  const unit = unitOfMeasure == CM ? "cm" : '"';
  return `${d.toFixed(2)}${unit}`;
}
