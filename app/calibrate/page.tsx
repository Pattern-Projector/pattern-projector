"use client";

import Matrix from "ml-matrix";
import Link from "next/link";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
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
import ResetWrenchIcon from "@/_icons/reset-wrench-icon";
import Rotate90DegreesCWIcon from "@/_icons/rotate-90-degrees-cw-icon";
import { getPerspectiveTransform, toMatrix3d } from "@/_lib/geometry";
import isValidPDF from "@/_lib/is-valid-pdf";
import { Point } from "@/_lib/point";
import removeNonDigits from "@/_lib/remove-non-digits";

export default function Page() {
  const defaultWidthDimensionValue = "24";
  const defaultHeightDimensionValue = "18";
  const maxPoints = 4; // One point per vertex in rectangle

  const handle = useFullScreenHandle();
  const sePoints = [
    // Points that fit on an iPhone SE
    { x: 100, y: 300 },
    { x: 300, y: 300 },
    { x: 300, y: 600 },
    { x: 100, y: 600 },
  ];

  const [points, setPoints] = useState<Point[]>(sePoints);
  const [degrees, setDegrees] = useState<number>(0);
  const [pointToModify, setPointToModify] = useState<number | null>(null);
  const [width, setWidth] = useState(defaultWidthDimensionValue);
  const [height, setHeight] = useState(defaultHeightDimensionValue);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [perspective, setPerspective] = useState<Matrix>(Matrix.identity(3, 3));
  const [matrix3d, setMatrix3d] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [inverted, setInverted] = useState<boolean>(false);
  const [scale, setScale] = useState<Point>({ x: 1, y: 1 });
  const [controlsOn, setControlsOn] = useState<boolean>(true);
  const [lastMoveTime, setLastMoveTime] = useState<number>(Date.now());
  const [windowScreen, setWindowScreen] = useState<Point>({ x: 0, y: 0 });
  const [localTransform, setLocalTransform] = useState<Matrix>(
    Matrix.identity(3, 3)
  );
  const [calibrationTransform, setCalibrationTransform] = useState<Matrix>(
    Matrix.identity(3, 3)
  );

  function visible(b: boolean): string {
    if (b) {
      return "visible";
    } else {
      return "hidden";
    }
  }

  function resetPoints(): void {
    setPoints(sePoints); // TODO: Do based on screen size
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

  const requestWakeLock = useCallback(async () => {
    if ("wakeLock" in navigator) {
      try {
        await navigator.wakeLock.request("screen");
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    requestWakeLock();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const p = { x: window.screenX, y: window.screenY };
      if (windowScreen.x !== p.x || windowScreen.y !== p.y) {
        setWindowScreen(p);
      }
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
    } else {
      resetPoints();
    }
  }, []);

  useEffect(() => {
    setMatrix3d(toMatrix3d(localTransform));
  }, [localTransform]);

  useEffect(() => {
    if (points && points.length === maxPoints) {
      let m = getPerspectiveTransform(points, getDstVertices());
      let n = getPerspectiveTransform(getDstVertices(), points);
      setPerspective(m);
      setLocalTransform(n);
      setCalibrationTransform(n);
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
      <FullScreen handle={handle} className="flex items-start">
        <div
          className={`absolute flex z-20 w-full ${
            isCalibrating || controlsOn ? "opacity-100" : "opacity-0"
          } transition-opacity ease-in-out duration-1000 `}
        >
          <div
            className={`flex flex-wrap items-center gap-4 m-4 w-[calc(100%-4rem)]`}
          >
            <Link href="/">
              <CloseIcon />
            </Link>
            <button
              className="text-white bg-gray-800 border border-gray-600 focus:outline-none hover:bg-gray-700 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5"
              onClick={() => setIsCalibrating(!isCalibrating)}
            >
              {isCalibrating ? "Show Pattern" : "Show Calibration"}
            </button>
            <FileInput
              accept="application/pdf"
              className={`w-full sm:w-fit z-10 appearance-none border-2 rounded py-2 px-4 leading-tight bg-gray-800 border-gray-600 placeholder-gray-400 text-white focus:ring-4 focus:ring-gray-200 ${visible(
                !isCalibrating
              )}`}
              handleChange={handleFileChange}
              id="pdfFile"
            ></FileInput>
            <button
              className={`${visible(!isCalibrating)}`}
              name={"Invert colors"}
              onClick={() => setInverted(!inverted)}
            >
              {inverted ? <InvertColorOffIcon /> : <InvertColorIcon />}
            </button>
            <button
              className={`${visible(!isCalibrating)}`}
              name={"Flip vertically"}
              onClick={() => setScale({ x: scale.x * -1, y: scale.y })}
            >
              {scale.x === -1 ? <FlipVerticalOffIcon /> : <FlipVerticalIcon />}
            </button>
            <button
              className={`${visible(!isCalibrating)}`}
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
              className={`${visible(!isCalibrating)}`}
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
            <span className={`${visible(isCalibrating)}`}>in inches</span>
            <button
              className={`${visible(isCalibrating)}`}
              name={"Reset points"}
              onClick={() => resetPoints()}
            >
              <ResetWrenchIcon />
            </button>
          </div>
          <FullScreenButton
            className={`z-20 absolute right-0 p-4 pt-7`}
            handle={handle}
          />
        </div>

        <CalibrationCanvas
          className={`absolute cursor-crosshair z-10 ${visible(isCalibrating)}`}
          windowScreen={windowScreen}
          points={points}
          setPoints={setPoints}
          pointToModify={pointToModify}
          setPointToModify={setPointToModify}
          perspective={calibrationTransform}
          width={+width}
          height={+height}
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
