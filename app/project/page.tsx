"use client";

import Matrix from "ml-matrix";
import Link from "next/link";
import { ChangeEvent, MouseEvent, useEffect, useState } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import CalibrationCanvas from "@/_components/calibration-canvas";
import DimensionsInput from "@/_components/dimensions-input";
import Draggable from "@/_components/draggable";
import FileInput from "@/_components/file-input";
import FullScreenButton from "@/_components/full-screen-button";
import PDFViewer from "@/_components/pdf-viewer";
import ArrowBackIcon from "@/_icons/arrow-back-icon";
import FlipHorizontalIcon from "@/_icons/flip-horizontal-icon";
import FlipHorizontalOffIcon from "@/_icons/flip-horizontal-off-icon";
import FlipVerticalIcon from "@/_icons/flip-vertical-icon";
import FlipVerticalOffIcon from "@/_icons/flip-vertical-off-icon";
import InvertColorIcon from "@/_icons/invert-color-icon";
import InvertColorOffIcon from "@/_icons/invert-color-off-icon";
import Rotate90DegreesCWIcon from "@/_icons/rotate-90-degrees-cw-icon";
import {
  getPerspectiveTransform,
  minIndex,
  sqrdist,
  toMatrix3d,
} from "@/_lib/geometry";
import isValidPDF from "@/_lib/is-valid-pdf";
import Point from "@/_lib/point";
import removeNonDigits from "@/_lib/remove-non-digits";

export default function Page() {
  const defaultWidthDimensionValue = "24";
  const defaultHeightDimensionValue = "18";
  const handle = useFullScreenHandle();
  const maxPoints = 4; // One point per vertex in rectangle
  const radius = 30;

  const [points, setPoints] = useState<Point[]>([
    // Default points that match closely enough to my setup with a 24 x 18 inch mat
    { x: 190, y: 190 },
    { x: 1150, y: 160 },
    { x: 1150, y: 900 },
    { x: 160, y: 900 },
  ]);
  const [degrees, setDegrees] = useState<number>(0);
  const [pointToModiy, setPointToModify] = useState<number | null>(null);
  const [width, setWidth] = useState(defaultWidthDimensionValue);
  const [height, setHeight] = useState(defaultHeightDimensionValue);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [perspective, setPerspective] = useState<Matrix>(Matrix.identity(3, 3));
  const [localTransform, setLocalTransform] = useState<Matrix>(
    Matrix.identity(3, 3)
  );
  const [matrix3d, setMatrix3d] = useState<string>("");
  const [calibrationMatrix3d, setCalibrationMatrix3d] = useState<string>("");
  const [calibrationTransform, setCalibrationTransform] = useState<Matrix>(
    Matrix.identity(3, 3)
  );
  const [file, setFile] = useState<File | null>(null);
  const [inverted, setInverted] = useState<boolean>(true);
  const [scale, setScale] = useState<Point>({ x: 1, y: 1 });

  function draw(ctx: CanvasRenderingContext2D) {
    const rect = ctx.canvas.getBoundingClientRect(); // Find position of canvas below navbar to offset x and y
    ctx.strokeStyle = "#36cf11";

    let prev = points[0];
    for (let point of points) {
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

  function toCanvasPoint(e: MouseEvent): Point {
    return { x: e.clientX, y: e.clientY };
  }

  function handleMouseDown(e: MouseEvent) {
    const newPoint = toCanvasPoint(e);
    if (points.length < maxPoints) {
      setPoints([...points, newPoint]);
    } else {
      setPointToModify(minIndex(points.map((a) => sqrdist(a, newPoint))));
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (pointToModiy !== null) {
      if ((e.buttons & 1) == 0) {
        setPointToModify(null);
      } else {
        const newPoints = [...points];
        newPoints[pointToModiy] = toCanvasPoint(e);
        setPoints(newPoints);
      }
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

  // EFFECTS

  useEffect(() => {
    const localPoints = localStorage.getItem("points");
    if (localPoints !== null) {
      setPoints(JSON.parse(localPoints));
    }
  }, []);

  useEffect(() => {
    setCalibrationMatrix3d(toMatrix3d(calibrationTransform));
  }, [calibrationTransform]);

  useEffect(() => {
    setMatrix3d(toMatrix3d(localTransform));
  }, [localTransform]);

  useEffect(() => {
    if (points.length === maxPoints) {
      let m = getPerspectiveTransform(points, getDstVertices());
      let n = getPerspectiveTransform(getDstVertices(), points);
      setCalibrationTransform(n);
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
        <div className="flex flex-wrap items-center gap-4 m-4">
          <Link href="/">
            <ArrowBackIcon />
          </Link>
          <button
            className="z-10 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
            onClick={() => setIsCalibrating(!isCalibrating)}
          >
            {isCalibrating ? "Show Pattern" : "Show Calibration"}
          </button>
          {!isCalibrating && (
            <>
              <FileInput
                accept="application/pdf"
                handleChange={handleFileChange}
                id="pdfFile"
              ></FileInput>

              <button
                className={"z-10"}
                name={"Invert colors"}
                onClick={() => setInverted(!inverted)}
              >
                {inverted ? <InvertColorOffIcon /> : <InvertColorIcon />}
              </button>

              <button
                className={"z-10"}
                name={"Flip vertically"}
                onClick={() => setScale({ x: scale.x * -1, y: scale.y })}
              >
                {scale.x === -1 ? (
                  <FlipVerticalOffIcon />
                ) : (
                  <FlipVerticalIcon />
                )}
              </button>

              <button
                className={"z-10"}
                name={"Flip horizontally"}
                onClick={() => setScale({ x: scale.x, y: scale.y * -1 })}
              >
                {scale.y === -1 ? (
                  <FlipHorizontalOffIcon />
                ) : (
                  <FlipHorizontalIcon />
                )}
              </button>

              <button
                className={"z-10"}
                name={"Rotate 90 degrees clockwise"}
                onClick={() => setDegrees((degrees + 90) % 360)}
              >
                <Rotate90DegreesCWIcon />
              </button>
            </>
          )}

          {isCalibrating && (
            <DimensionsInput
              width={width}
              height={height}
              handleWidthChange={handleWidthChange}
              handleHeightChange={handleHeightChange}
            />
          )}

          <FullScreenButton className="z-10 ml-auto" handle={handle} />
        </div>

        {isCalibrating && (
          <div>
            <CalibrationCanvas
              className="absolute cursor-crosshair z-10"
              onMouseDown={(e: MouseEvent) => handleMouseDown(e)}
              onMouseMove={(e: MouseEvent) => handleMouseMove(e)}
              onMouseUp={(e: MouseEvent) => handleMouseUp(e)}
              draw={draw}
            />
            <div
              onMouseDown={(e: MouseEvent) => handleMouseDown(e)}
              onMouseMove={(e: MouseEvent) => handleMouseMove(e)}
              onMouseUp={(e: MouseEvent) => handleMouseUp(e)}
              style={{
                cursor: "crosshair",
                zIndex: 20,
                position: "absolute",
                transform: calibrationMatrix3d,
                transformOrigin: "0 0",
                // assuming inches
                width: `${+width * 96 + 1}px`, // 96 pixels per inch in CSS
                height: `${+height * 96 + 1}px`,
                inset: "0 0 0 0",
                //margin: "0",
                backgroundImage:
                  "repeating-linear-gradient(#fff 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 100%)",
                backgroundSize: "1in 1in",
              }}
            ></div>
          </div>
        )}

        {!isCalibrating && (
          <Draggable
            localTransform={localTransform}
            setLocalTransform={setLocalTransform}
            perspective={perspective}
          >
            <div
              className={"absolute z-0"}
              style={{
                transform: `${matrix3d}`,
                transformOrigin: "0 0",
                filter: `invert(${inverted ? "1" : "0"})`,
              }}
            >
              <div
                style={{
                  transform: `scale(${scale.x}, ${scale.y}) rotate(${degrees}deg)`,
                  transformOrigin: "center",
                }}
              >
                <PDFViewer file={file} />
              </div>
            </div>
          </Draggable>
        )}
      </FullScreen>
    </main>
  );
}
