// TODO:
// Find DPI
// Dragging reliable
// Grid
// Calibration and movement separate

"use client";

import Matrix from "ml-matrix";
import { ChangeEvent, MouseEvent, useEffect, useState } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import CalibrationCanvas from "@/_components/calibration-canvas";
import DimensionsInput from "@/_components/dimensions-input";
import Draggable from "@/_components/draggable";
import FullScreenButton from "@/_components/full-screen-button";
import LabelledFileInput from "@/_components/labelled-file-input";
import PDFViewer from "@/_components/pdf-viewer";
import getPerspectiveTransform from "@/_lib/get-perspective-transform";
import Point from "@/_lib/interfaces/point";
import { Unit } from "@/_lib/interfaces/unit";
import isInRadius from "@/_lib/is-in-radius";
import isValidPDF from "@/_lib/is-valid-pdf";
import removeNonDigits from "@/_lib/remove-non-digits";
import toMatrix3d from "@/_lib/to-matrix3d";

export default function Home() {
  const defaultDimensionValue = "5";
  const handle = useFullScreenHandle();
  const maxPoints = 4; // One point per vertex in rectangle
  const radius = 30;

  const [points, setPoints] = useState<Point[]>([]);
  const [pointToModiy, setPointToModify] = useState<number | null>(null);
  const [width, setWidth] = useState(defaultDimensionValue);
  const [height, setHeight] = useState(defaultDimensionValue);
  const [unit, setUnit] = useState(Unit.Inches);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [perspective, setPerspective] = useState<Matrix>(Matrix.identity(3, 3));
  const [localTransform, setLocalTransform] = useState<Matrix>(
    Matrix.identity(3, 3)
  );
  const [matrix3d, setMatrix3d] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [inverted, setInverted] = useState<boolean>(true);

  function draw(ctx: CanvasRenderingContext2D) {
    const rect = ctx.canvas.getBoundingClientRect(); // Find position of canvas below navbar to offset x and y
    let prev = points[0];
    for (let point of points) {
      ctx.strokeStyle = "#36cf11";

      ctx.moveTo(prev.x - rect.left, prev.y - rect.top);
      ctx.lineTo(point.x - rect.left, point.y - rect.top);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(point.x - rect.left, point.y - rect.top, radius, 0, Math.PI * 2);
      ctx.stroke();
      prev = point;
    }

    if (points.length === maxPoints) {
      ctx.moveTo(prev.x - rect.left, prev.y - rect.top);
      ctx.lineTo(points[0].x - rect.left, points[0].y - rect.top);
      ctx.stroke();
    }
  }

  // HANDLERS

  function handleHeightChange(e: ChangeEvent<HTMLInputElement>) {
    const height = removeNonDigits(e.target.value);
    setHeight(height);
  }

  function handleWidthChange(e: ChangeEvent<HTMLInputElement>) {
    const width = removeNonDigits(e.target.value);
    setWidth(width);
  }

  function handleUnitChange(e: ChangeEvent<HTMLInputElement>) {
    setUnit(e.target.id as Unit);
  }

  function handleMouseDown(e: MouseEvent) {
    const newPoint = { x: e.clientX, y: e.clientY };
    if (points.length < maxPoints) {
      setPoints([...points, newPoint]);
      localStorage.setItem("points", JSON.stringify([...points, newPoint]));
    } else {
      for (let [i, point] of points.entries()) {
        if (isInRadius(newPoint, point, radius)) {
          setPointToModify(i);
        }
      }
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (pointToModiy !== null) {
      const newPoints = [...points];
      newPoints[pointToModiy] = { x: e.clientX, y: e.clientY };
      setPoints(newPoints);
    }
  }

  function handleMouseUp(e: MouseEvent) {
    localStorage.setItem("points", JSON.stringify(points));
    setPointToModify(null);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>): void {
    const { files } = e.target;

    if (files && files[0] && isValidPDF(files[0])) {
      setFile(files[0]);
    }
  }

  function handleOnClickInvert(): void {
    setInverted(!inverted);
  }

  function handleOnClickCalibrate(): void {
    setIsCalibrating(!isCalibrating);
  }

  // EFFECTS

  useEffect(() => {
    const localPoints = localStorage.getItem("points");
    if (localPoints !== null) {
      setPoints(JSON.parse(localPoints));
    }
  }, []);

  useEffect(() => {
    setMatrix3d(toMatrix3d(localTransform));
  }, [localTransform]);

  useEffect(() => {
    if (points.length === maxPoints) {
      let m = getPerspectiveTransform(points, getDstVertices());
      let n = getPerspectiveTransform(getDstVertices(), points);
      setPerspective(m);
      setLocalTransform(n);
    }

    function getDstVertices(): Point[] {
      const ppi = 96; // defined by css.
      const ox = 0;
      const oy = 0;
      const mx = +width * ppi + ox;
      const my = +height * ppi + oy;

      const dstVertices = [
        { x: ox, y: oy },
        { x: mx, y: oy },
        { x: mx, y: my },
        { x: ox, y: my },
      ];

      return dstVertices;
    }
  }, [points, width, height]);

  return (
    <main>
      <FullScreen handle={handle}>
        <Draggable
          localTransform={localTransform}
          setLocalTransform={setLocalTransform}
          perspective={perspective}
        >
          <div className="flex flex-wrap items-center gap-4 m-4">
            <button
              className="z-10 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
              onClick={handleOnClickCalibrate}
            >
              {isCalibrating ? "Show Pattern" : "Show Calibration"}
            </button>
            {!isCalibrating && (
              <>
                <LabelledFileInput
                  accept="application/pdf"
                  handleChange={handleFileChange}
                  id="pdfFile"
                  inputTestId="pdfFile"
                  label=""
                ></LabelledFileInput>

                <button
                  className="z-10 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
                  onClick={handleOnClickInvert}
                  type="button"
                >
                  Invert
                </button>
              </>
            )}

            {isCalibrating && (
              <DimensionsInput
                width={width}
                height={height}
                handleWidthChange={handleWidthChange}
                handleHeightChange={handleHeightChange}
                handleUnitChange={handleUnitChange}
              />
            )}

            <FullScreenButton className="z-10 ml-auto" handle={handle} />
          </div>

          {isCalibrating && (
            <CalibrationCanvas
              className="absolute cursor-crosshair z-10"
              onMouseDown={(e: MouseEvent) => handleMouseDown(e)}
              onMouseMove={(e: MouseEvent) => handleMouseMove(e)}
              onMouseUp={(e: MouseEvent) => handleMouseUp(e)}
              draw={draw}
            />
          )}

          {!isCalibrating && (
            <PDFViewer
              file={file}
              style={{
                transform: matrix3d,
                transformOrigin: "0 0",
                filter: `invert(${inverted ? "1" : "0"})`,
                // width: "100%",
                // height: "100%",
                // TODO: add grid overlay
                margin: "0",
                zoom: "100%",
                backgroundImage:
                  "repeating-linear-gradient(#fff 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 100%)",
                backgroundSize: "1in 1in",
              }}
            />
          )}
        </Draggable>
      </FullScreen>
    </main>
  );
}
