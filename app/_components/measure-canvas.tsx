import {
  angleDeg,
  constrained,
  dist,
  distToLine,
  getLineFromVector,
  transformLine,
  transformPoint,
} from "@/_lib/geometry";
import { CSS_PIXELS_PER_INCH } from "@/_lib/pixels-per-inch";
import { Point } from "@/_lib/point";
import Matrix, { inverse } from "ml-matrix";
import React, {
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { drawArrow, drawCircle, drawLine } from "@/_lib/drawing";
import { useTransformContext } from "@/_hooks/use-transform-context";
import { Line } from "@/_lib/interfaces/line";

import { KeyCode } from "@/_lib/key-code";
import LineMenu from "./line-menu";
import { useKeyDown } from "@/_hooks/use-key-down";
import { useKeyUp } from "@/_hooks/use-key-up";
import { CM } from "@/_lib/unit";
import { Vector } from "@/_lib/interfaces/vector";
import InlineInput from "@/_components/inline-input";

export default function MeasureCanvas({
  perspective,
  calibrationTransform,
  unitOfMeasure,
  className,
  measuring,
  setMeasuring,
  file,
  gridCenter,
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
  children: React.ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragOffset = useRef<Point | null>(null);

  const [selectedLine, setSelectedLine] = useState<number>(-1);
  const [lines, setLines] = useState<Line[]>([]); // pattern space coordinates.
  const [axisConstrained, setAxisConstrained] = useState<boolean>(false);
  const [angleValue, setAngleValue] = useState<string>("0");
  const [distanceValue, setDistanceValue] = useState<string>("1");
  const [nextFocusIdx, setNextFocusIdx] = useState<number>(-1);
  const [clientLine, setClientLine] = useState<Line | null>(null);
  const [matLine, setMatLine] = useState<Line | null>(null);
  const lengthInputRef = useRef<HTMLInputElement>(null);
  const angleInputRef = useRef<HTMLInputElement>(null);
  const transform = useTransformContext();

  const disablePointer = measuring || dragOffset.current;

  const endCircleRadius = 24;
  const lineTouchRadius = 48;

  // Update the authoritative line data from the currently selected line
  // if it exists, including matrix transforms and all
  useEffect(() => {
    if (lines.length > 0 && selectedLine >= 0) {
      const patternLine = lines[selectedLine];
      const newMatLine = transformLine(patternLine, transform);
      if (axisConstrained && dragOffset.current) {
        newMatLine[1] = constrained(newMatLine[1], newMatLine[0]);
      }

      setMatLine(newMatLine);
      setClientLine(transformLine(newMatLine, calibrationTransform));
    } else {
      setClientLine(null);
      setMatLine(null);
    }
  }, [lines, selectedLine, transform, axisConstrained, calibrationTransform]);

  useEffect(() => {
    if (
      nextFocusIdx === 0 &&
      lengthInputRef.current &&
      document.activeElement !== lengthInputRef.current
    ) {
      lengthInputRef.current.focus();
      lengthInputRef.current.select();
    } else if (
      nextFocusIdx === 1 &&
      angleInputRef.current &&
      document.activeElement !== angleInputRef.current
    ) {
      angleInputRef.current.focus();
      angleInputRef.current.select();
    }
  }, [nextFocusIdx]);

  // Tab key is forced to switch between line inputs
  // until either escape or enter is pressed
  useKeyDown(
    (e: KeyboardEvent) => {
      // Only if there's a selected line
      // and only if the input is valid
      if (
        +distanceValue > 0 &&
        +distanceValue < 1000 &&
        +angleValue >= 0 &&
        +angleValue <= 360 &&
        selectedLine >= 0
      ) {
        e.preventDefault();
        // Update the focus
        if (nextFocusIdx === 1 || nextFocusIdx === -1) {
          setNextFocusIdx(0);
        } else if (nextFocusIdx === 0) {
          setNextFocusIdx(1);
        }

        // Update the line
        if (matLine && distanceValue && angleValue) {
          let distance = +distanceValue * CSS_PIXELS_PER_INCH;
          if (unitOfMeasure === CM) {
            distance /= 2.54;
          }
          const currentVector: Vector = [matLine[0], distance, +angleValue];
          const newLine = getLineFromVector(currentVector);
          const newMatLine = transformLine(newLine, transform);
          setMatLine(newMatLine);
          setClientLine(transformLine(newMatLine, calibrationTransform));
        }
      }
    },
    [KeyCode.Tab],
  );

  const saveVectorLine = () => {
    if (matLine && distanceValue && angleValue) {
      let distance = +distanceValue * CSS_PIXELS_PER_INCH;
      if (unitOfMeasure === CM) {
        distance /= 2.54;
      }
      const currentVector: Vector = [matLine[0], distance, +angleValue];
      lines.splice(selectedLine, 1, getLineFromVector(currentVector));
    }
  };

  // If we are actively editing a line
  // via text inputs, then apply the values
  // and remove focus
  useKeyDown(() => {
    if (selectedLine >= 0 && nextFocusIdx > -1) {
      saveVectorLine();
      // Deselect the line - we have applied the changes
      setSelectedLine(-1);
    }
  }, [KeyCode.Enter]);

  // Cancel text input operation
  useKeyDown(() => {
    if (selectedLine >= 0) {
      // Deselect the line - no changes on escape
      setSelectedLine(-1);
    }
  }, [KeyCode.Escape]);

  // useKeyDown(() => {
  //   if (selectedLine >= 0 && nextFocusIdx === -1) {
  //     // Deselect the line - we have applied the changes
  //     handleDeleteLine();
  //   }
  // }, [KeyCode.Backspace]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const client = { x: e.clientX, y: e.clientY };
    const patternToClient = calibrationTransform.mmul(transform);

    // Possibly select a line.
    for (let i = 0; i < lines.length; i++) {
      const patternLine = lines[i];
      const newClientLine = transformLine(patternLine, patternToClient);
      // Start dragging one end of the selected line?
      if (selectedLine == i) {
        let minDist = lineTouchRadius;
        let minEnd = -1;
        for (const end of [0, 1]) {
          const clientEnd = newClientLine[end];
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

      if (distToLine(newClientLine, client) < endCircleRadius) {
        // select/deselect the line.
        setSelectedLine(i == selectedLine ? -1 : i);
        e.stopPropagation();
        return;
      }
    }

    // Nothing selected. Save text input changes
    saveVectorLine();
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
    setMeasuring(false);
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

  useEffect(() => {
    if (selectedLine >= 0) {
      setNextFocusIdx(0);
    } else {
      setNextFocusIdx(-1);
    }
  }, [selectedLine]);

  useKeyDown(() => {
    setAxisConstrained(true);
  }, [KeyCode.ShiftLeft, KeyCode.ShiftRight]);

  useKeyUp(() => {
    setAxisConstrained(false);
  }, [KeyCode.ShiftLeft, KeyCode.ShiftRight]);

  useEffect(() => {
    if (matLine) {
      setAngleValue(Math.round(getAngle(matLine)).toString(10));
      setDistanceValue(
        (Math.round(getDistance(matLine, unitOfMeasure) * 100) / 100).toString(
          10,
        ),
      );
    }
  }, [matLine, unitOfMeasure]);

  // Draw line canvas
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
        if (lines.length > 0 && clientLine && matLine) {
          // const patternLine = lines[selectedLine];
          // const matLine = transformLine(patternLine, transform);
          // if (axisConstrained && dragOffset.current) {
          //   matLine[1] = constrained(matLine[1], matLine[0]);
          // }
          // const clientLine = transformLine(matLine, calibrationTransform);
          drawArrow(ctx, clientLine);
          drawCircle(ctx, clientLine[0], endCircleRadius);
          drawCircle(ctx, clientLine[1], endCircleRadius);
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
    matLine,
  ]);

  useEffect(() => {
    setLines([]);
    setSelectedLine(-1);
  }, [file]);

  const InputNodes: ReactNode = useMemo(() => {
    if (clientLine) {
      const location = {
        x: clientLine[1].x + endCircleRadius + 8,
        y: clientLine[1].y,
      };
      return (
        <div
          style={{ position: "absolute", left: location.x, top: location.y }}
          onMouseDownCapture={(e) => {
            e.stopPropagation();
          }}
        >
          <InlineInput
            className="relative flex flex-col w-18 mb-0.5"
            inputClassName="pl-2 pr-10"
            inputRef={lengthInputRef}
            value={distanceValue}
            handleChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (
                (/^\d*\.?\d*$/.test(e.target.value) &&
                  +e.target.value > 0 &&
                  +e.target.value < 1000) ||
                e.target.value === ""
              ) {
                setDistanceValue(e.target.value);
              }
            }}
            labelRight={unitOfMeasure === CM ? "cm" : "in"}
          />
          <InlineInput
            className="relative flex flex-col w-18 mb-0.5"
            inputClassName="pl-2 pr-10"
            inputRef={angleInputRef}
            value={angleValue}
            handleChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (
                (/^\d*\.?\d*$/.test(e.target.value) &&
                  +e.target.value >= 0 &&
                  +e.target.value <= 360) ||
                e.target.value === ""
              ) {
                setAngleValue(e.target.value);
              }
            }}
            labelRight="&deg;"
          />
        </div>
      );
    }
    return null;
  }, [angleValue, clientLine, distanceValue]);

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
        {InputNodes}
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
      />
    </div>
  );
}

function getAngle(line: Line): number {
  let a = -angleDeg(line);
  if (a < 0) {
    a += 360;
  }
  return a;
}

function measurementsString(line: Line, unitOfMeasure: string): string {
  const a = getAngle(line);
  let label = a.toFixed(0);
  if (label == "360") {
    label = "0";
  }
  const d = distanceString(line, unitOfMeasure);
  return `${d} ${label}°`;
}

function getDistance(line: Line, unitOfMeasure: string): number {
  let d = dist(...line) / CSS_PIXELS_PER_INCH;
  if (unitOfMeasure == CM) {
    d *= 2.54;
  }
  return d;
}

function distanceString(line: Line, unitOfMeasure: string): string {
  const d = getDistance(line, unitOfMeasure);
  const unit = unitOfMeasure == CM ? "cm" : '"';
  return `${d.toFixed(2)}${unit}`;
}
