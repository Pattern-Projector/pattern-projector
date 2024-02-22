"use client";

import Matrix from "ml-matrix";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import CalibrationCanvas from "@/_components/calibration-canvas";
import Draggable from "@/_components/draggable";
import Header from "@/_components/header";
import PDFViewer from "@/_components/pdf-viewer";
import {
  getPerspectiveTransform,
  toMatrix3d,
  translate,
} from "@/_lib/geometry";
import isValidPDF from "@/_lib/is-valid-pdf";
import { Point } from "@/_lib/point";
import removeNonDigits from "@/_lib/remove-non-digits";
import {
  getDefaultTransforms,
  TransformSettings,
} from "@/_lib/transform-settings";
import { CM, IN } from "@/_lib/unit";

const defaultPoints = [
  // Points that fit on an iPhone SE
  { x: 100, y: 300 },
  { x: 300, y: 300 },
  { x: 300, y: 600 },
  { x: 100, y: 600 },
];

export default function Page() {
  const defaultWidthDimensionValue = "24";
  const defaultHeightDimensionValue = "18";
  const maxPoints = 4; // One point per vertex in rectangle

  const handle = useFullScreenHandle();

  const [points, setPoints] = useState<Point[]>(defaultPoints);
  const [transformSettings, setTransformSettings] = useState<TransformSettings>(
    getDefaultTransforms()
  );
  const [pointToModify, setPointToModify] = useState<number | null>(null);
  const [width, setWidth] = useState(defaultWidthDimensionValue);
  const [height, setHeight] = useState(defaultHeightDimensionValue);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [perspective, setPerspective] = useState<Matrix>(Matrix.identity(3, 3));
  const [matrix3d, setMatrix3d] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [windowScreen, setWindowScreen] = useState<Point>({ x: 0, y: 0 });
  const [localTransform, setLocalTransform] = useState<Matrix>(
    Matrix.identity(3, 3)
  );
  const [calibrationTransform, setCalibrationTransform] = useState<Matrix>(
    Matrix.identity(3, 3)
  );
  const [canvasOffset, setCanvasOffset] = useState<Point>({ x: 0, y: 0 });
  const [pageCount, setPageCount] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [unitOfMeasure, setUnitOfMeasure] = useState(IN);

  function visible(b: boolean): string {
    return b ? "visible" : "hidden";
  }

  function getDefaultPoints() {
    const o = 150;
    const minx = window.innerWidth * 0.2 - canvasOffset.x;
    const miny = window.innerHeight * 0.2 - canvasOffset.y;
    const maxx = window.innerWidth * 0.8 - canvasOffset.x;
    const maxy = window.innerHeight * 0.8 - canvasOffset.y;

    const p = [
      { x: minx, y: miny },
      { x: maxx, y: miny },
      { x: maxx, y: maxy },
      { x: minx, y: maxy },
    ];
    console.log(p);
    return p;
  }

  const ptDensity = unitOfMeasure === CM ? 96 / 2.54 : 96;

  // HANDLERS

  function handleHeightChange(e: ChangeEvent<HTMLInputElement>) {
    const h = removeNonDigits(e.target.value, height);
    setHeight(h);
    localStorage.setItem(
      "canvasSettings",
      JSON.stringify({ height: h, width, unitOfMeasure })
    );
  }

  function handleWidthChange(e: ChangeEvent<HTMLInputElement>) {
    const w = removeNonDigits(e.target.value, width);
    setWidth(w);
    localStorage.setItem(
      "canvasSettings",
      JSON.stringify({ height, width: w, unitOfMeasure })
    );
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>): void {
    const { files } = e.target;

    if (files && files[0] && isValidPDF(files[0])) {
      setFile(files[0]);
    }
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
    const dy = windowScreen.y + window.outerHeight - window.innerHeight;
    const dx = windowScreen.x + window.outerWidth - window.innerWidth;
    setCanvasOffset({ x: -dx, y: -dy });
  }, [windowScreen.x, windowScreen.y]);

  useEffect(() => {
    const interval = setInterval(() => {
      const p = { x: window.screenX, y: window.screenY };
      if (windowScreen.x !== p.x || windowScreen.y !== p.y) {
        setWindowScreen(p);
      }
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const localPoints = localStorage.getItem("points");
    if (localPoints !== null) {
      setPoints(JSON.parse(localPoints));
    } else {
      setPoints(getDefaultPoints());
    }
    const localSettingString = localStorage.getItem("canvasSettings");
    if (localSettingString !== null) {
      const localSettings = JSON.parse(localSettingString);
      if (localSettings.height) {
        setHeight(localSettings.height);
      }
      if (localSettings.width) {
        setWidth(localSettings.width);
      }
      if (localSettings.unitOfMeasure) {
        setUnitOfMeasure(localSettings.unitOfMeasure);
      }
    }
  }, []);

  useEffect(() => {
    const offset = translate(canvasOffset);
    setMatrix3d(toMatrix3d(offset.mmul(localTransform)));
  }, [localTransform, canvasOffset]);

  useEffect(() => {
    if (points && points.length === maxPoints) {
      let m = getPerspectiveTransform(points, getDstVertices());
      let n = getPerspectiveTransform(getDstVertices(), points);
      setPerspective(m);
      setLocalTransform(n);
      setCalibrationTransform(n);
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
  }, [points, width, height, unitOfMeasure]);

  return (
    <main
      style={{
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "white",
      }}
    >
      <FullScreen handle={handle} className="bg-white">
        <div
          className={`z-20 absolute opacity-100 transition-opacity ease-in-out duration-1000 `}
        />
        <Header
          isCalibrating={isCalibrating}
          setIsCalibrating={setIsCalibrating}
          height={height}
          width={width}
          handleHeightChange={handleHeightChange}
          handleWidthChange={handleWidthChange}
          handleResetCalibration={() => setPoints(getDefaultPoints())}
          handleFileChange={handleFileChange}
          fullScreenHandle={handle}
          unitOfMeasure={unitOfMeasure}
          setUnitOfMeasure={(newUnit) => {
            setUnitOfMeasure(newUnit);
            localStorage.setItem(
              "canvasSettings",
              JSON.stringify({ height, width, unitOfMeasure: newUnit })
            );
          }}
          transformSettings={transformSettings}
          setTransformSettings={setTransformSettings}
          pageNumber={pageNumber}
          setPageNumber={setPageNumber}
          pageCount={pageCount}
        />
        <CalibrationCanvas
          className={`absolute z-10`}
          canvasOffset={canvasOffset}
          points={points}
          setPoints={setPoints}
          pointToModify={pointToModify}
          setPointToModify={setPointToModify}
          perspective={calibrationTransform}
          width={+width}
          height={+height}
          isCalibrating={isCalibrating}
          ptDensity={ptDensity}
        />
        <Draggable
          className={`cursor-grabbing select-none ${visible(!isCalibrating)}`}
          localTransform={localTransform}
          setLocalTransform={setLocalTransform}
          perspective={perspective}
        >
          <div
            className={"absolute z-0 border-8 border-purple-700"}
            style={{
              transform: `${matrix3d}`,
              transformOrigin: "0 0",
              filter: `invert(${transformSettings.inverted ? "1" : "0"})`,
            }}
          >
            <div
              style={{
                transform: `scale(${transformSettings.scale.x}, ${transformSettings.scale.y}) rotate(${transformSettings.degrees}deg)`,
                transformOrigin: "center",
              }}
            >
              <PDFViewer
                file={file}
                setPageCount={setPageCount}
                setPageNumber={setPageNumber}
                pageNumber={pageNumber}
              />
            </div>
          </div>
        </Draggable>
      </FullScreen>
    </main>
  );
}
