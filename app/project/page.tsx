"use client";

import Matrix from "ml-matrix";
import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import CalibrationCanvas from "@/_components/calibration-canvas";
import Draggable from "@/_components/draggable";
import FileInput from "@/_components/file-input";
import FullScreenButton from "@/_components/full-screen-button";
import LabelledInput from "@/_components/labelled-input";
import PDFViewer from "@/_components/pdf-viewer";
import CloseIcon from "@/_icons/close-icon";
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
import { Point } from "@/_lib/point";
import removeNonDigits from "@/_lib/remove-non-digits";

export default function Page() {
  const defaultWidthDimensionValue = "24";
  const defaultHeightDimensionValue = "18";
  const handle = useFullScreenHandle();
  const maxPoints = 4; // One point per vertex in rectangle

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
  const [file, setFile] = useState<File | null>(null);
  const [inverted, setInverted] = useState<boolean>(true);
  const [scale, setScale] = useState<Point>({ x: 1, y: 1 });
  const [controlsOn, setControlsOn] = useState<boolean>(false);
  const [lastMoveTime, setLastMoveTime] = useState<number>(Date.now());
  const [windowScreen, setWindowScreen] = useState<Point>({ x: 0, y: 0 });

  function visible(b: boolean): string {
    if (b) {
      return "visible";
    } else {
      return "hidden";
    }
  }

  // HANDLERS

  function handleHeightChange(e: ChangeEvent<HTMLInputElement>) {
    const h = removeNonDigits(e.target.value, height);
    setHeight(h);
  }

  function handleWidthChange(e: ChangeEvent<HTMLInputElement>) {
    const w = removeNonDigits(e.target.value, width);
    setWidth(w);
  }

  function handleDown(newPoint: Point) {
    if (points.length < maxPoints) {
      setPoints([...points, newPoint]);
    } else {
      setPointToModify(minIndex(points.map((a) => sqrdist(a, newPoint))));
    }
  }

  function handleMove(p: Point) {
    if (pointToModiy !== null) {
      const newPoints = [...points];
      newPoints[pointToModiy] = p;
      setPoints(newPoints);
    }
  }

  function handleUp() {
    localStorage.setItem("points", JSON.stringify(points));
    setPointToModify(null);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>): void {
    const { files } = e.target;

    if (files && files[0] && isValidPDF(files[0])) {
      setFile(files[0]);
    }
  }

  function handleShowControls(
    e: React.MouseEvent<Element> | React.TouchEvent<Element>
  ): void {
    setControlsOn(true);
    setLastMoveTime(Date.now());
  }

  // EFFECTS
  useEffect(() => {
    const interval = setInterval(() => {
      const p = { x: window.screenX, y: window.screenY };
      if (windowScreen.x !== p.x || windowScreen.y !== p.y) {
        setWindowScreen(p);
      }
      console.log(window.visualViewport?.offsetTop);
    }, 500);
  });

  useEffect(() => {
    const controlTimeoutInMilliseconds = 5000;
    const interval = setInterval(() => {
      if (
        controlsOn &&
        Date.now() - lastMoveTime > controlTimeoutInMilliseconds
      ) {
        setControlsOn(false);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [controlsOn, lastMoveTime]);

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
    <main
      onMouseMove={(e) => handleShowControls(e)}
      onTouchStart={(e) => handleShowControls(e)}
      style={{ height: "100vh", width: "100vw", overflow: "hidden" }}
    >
      <FullScreen handle={handle} className="flex">
        <div
          className={`absolute z-20 flex flex-wrap items-center gap-4 m-4 w-[calc(100%-2rem)] ${visible(
            controlsOn
          )}`}
        >
          <Link href="/">
            <CloseIcon />
          </Link>
          <button
            className="z-10 text-white bg-gray-800 border border-gray-600 focus:outline-none hover:bg-gray-700 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5"
            onClick={() => setIsCalibrating(!isCalibrating)}
          >
            {isCalibrating ? "Show Pattern" : "Show Calibration"}
          </button>
          <FileInput
            accept="application/pdf"
            className={`z-10 appearance-none border-2 rounded py-2 px-4 leading-tight bg-gray-800 border-gray-600 placeholder-gray-400 text-white focus:ring-4 focus:ring-gray-200 ${visible(
              !isCalibrating
            )}`}
            handleChange={handleFileChange}
            id="pdfFile"
          ></FileInput>

          <button
            className={`z-10 ${visible(!isCalibrating)}`}
            name={"Invert colors"}
            onClick={() => setInverted(!inverted)}
          >
            {inverted ? <InvertColorOffIcon /> : <InvertColorIcon />}
          </button>

          <button
            className={`z-10 ${visible(!isCalibrating)}`}
            name={"Flip vertically"}
            onClick={() => setScale({ x: scale.x * -1, y: scale.y })}
          >
            {scale.x === -1 ? <FlipVerticalOffIcon /> : <FlipVerticalIcon />}
          </button>

          <button
            className={`z-10 ${visible(!isCalibrating)}`}
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
            className={`z-10 ${visible(!isCalibrating)}`}
            name={"Rotate 90 degrees clockwise"}
            onClick={() => setDegrees((degrees + 90) % 360)}
          >
            <Rotate90DegreesCWIcon />
          </button>

          <LabelledInput
            className={`${visible(isCalibrating)}`}
            handleChange={handleWidthChange}
            id="width"
            inputTestId="width"
            label="Width"
            name="width"
            value={width}
          />
          <LabelledInput
            className={`${visible(isCalibrating)}`}
            handleChange={handleHeightChange}
            id="height"
            inputTestId="height"
            label="Height"
            name="height"
            value={height}
          />
        </div>
        <FullScreenButton className="z-10 ml-auto m-4 mt-7" handle={handle} />

        <CalibrationCanvas
          className={`absolute cursor-crosshair z-10 ${visible(isCalibrating)}`}
          handleDown={handleDown}
          handleUp={handleUp}
          handleMove={handleMove}
          windowScreen={windowScreen}
          points={points}
        />

        <Draggable
          className={`cursor-grabbing select-none ${visible(!isCalibrating)}`}
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
      </FullScreen>
    </main>
  );
}
