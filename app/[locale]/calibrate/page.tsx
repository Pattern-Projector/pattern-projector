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
import { applyOffset, Point } from "@/_lib/point";
import removeNonDigits from "@/_lib/remove-non-digits";
import {
  getDefaultTransforms,
  TransformSettings,
} from "@/_lib/transform-settings";
import { CM, IN } from "@/_lib/unit";
import { Layer } from "@/_lib/layer";
import LayerMenu from "@/_components/layer-menu";
import useProgArrowKeyHandler from "@/_hooks/useProgArrowKeyHandler";
import useProgArrowKeyToMatrix from "@/_hooks/useProgArrowKeyToMatrix";
import { visible } from "@/_components/theme/css-functions";

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
    getDefaultTransforms(),
  );
  const [gridOn, setGridOn] = useState<boolean>(true);
  const [pointToModify, setPointToModify] = useState<number | null>(null);
  const [width, setWidth] = useState(defaultWidthDimensionValue);
  const [height, setHeight] = useState(defaultHeightDimensionValue);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [perspective, setPerspective] = useState<Matrix>(Matrix.identity(3, 3));
  const [matrix3d, setMatrix3d] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [windowScreen, setWindowScreen] = useState<Point>({ x: 0, y: 0 });
  const [localTransform, setLocalTransform] = useState<Matrix>(
    Matrix.identity(3, 3),
  );
  const [calibrationTransform, setCalibrationTransform] = useState<Matrix>(
    Matrix.identity(3, 3),
  );
  const [pageCount, setPageCount] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [unitOfMeasure, setUnitOfMeasure] = useState(IN);
  const [layers, setLayers] = useState<Map<string, Layer>>(new Map());
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [pageWidth, setPageWidth] = useState<number>(0);
  const [pageHeight, setPageHeight] = useState<number>(0);

  function getDefaultPoints() {
    const o = 150;
    const minx = window.innerWidth * 0.2;
    const miny = window.innerHeight * 0.2;
    const maxx = window.innerWidth * 0.8;
    const maxy = window.innerHeight * 0.8;

    const p = [
      { x: minx, y: miny },
      { x: maxx, y: miny },
      { x: maxx, y: maxy },
      { x: minx, y: maxy },
    ];
    return p;
  }

  const ptDensity = unitOfMeasure === CM ? 96 / 2.54 : 96;

  function updateLocalSettings(newSettings: {}) {
    const settingString = localStorage.getItem("canvasSettings");
    let currSettings = {};
    if (settingString) {
      try {
        currSettings = JSON.parse(settingString);
      } catch (e) {
        currSettings = {};
      }
    }
    const merged = Object.assign({}, currSettings, newSettings);
    localStorage.setItem("canvasSettings", JSON.stringify(merged));
  }

  // HANDLERS

  function handleHeightChange(e: ChangeEvent<HTMLInputElement>) {
    const h = removeNonDigits(e.target.value, height);
    setHeight(h);
    updateLocalSettings({ height: h });
  }

  function handleWidthChange(e: ChangeEvent<HTMLInputElement>) {
    const w = removeNonDigits(e.target.value, width);
    setWidth(w);
    updateLocalSettings({ width: w });
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
      const newTransformSettings: {
        inverted?: boolean;
        isInvertedGreen?: boolean;
        isFourCorners?: boolean;
      } = {};

      newTransformSettings.inverted = localSettings.inverted || false;
      newTransformSettings.isInvertedGreen =
        localSettings.isInvertedGreen || false;
      newTransformSettings.isFourCorners = localSettings.isFourCorners || false;
      setTransformSettings({ ...transformSettings, ...newTransformSettings });
    }
  }, []);

  const pdfTranslation = useProgArrowKeyToMatrix(!isCalibrating);

  useEffect(() => {
    setMatrix3d(toMatrix3d(localTransform.mmul(pdfTranslation)));
  }, [localTransform, pdfTranslation]);

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

  useEffect(() => {
    if (layers.size > 0) {
      setShowLayerMenu(true);
    } else {
      setShowLayerMenu(false);
    }
  }, [layers]);

  function getInversionFilters(inverted: boolean, isGreen: boolean): string {
    if (!inverted) {
      return "invert(0)";
    }
    return `invert(1) ${
      isGreen ? "sepia(100%) saturate(300%) hue-rotate(80deg)" : ""
    }`;
  }

  return (
    <main
      style={{
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
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
            updateLocalSettings({ unitOfMeasure: newUnit });
          }}
          transformSettings={transformSettings}
          setTransformSettings={(newSettings) => {
            setTransformSettings(newSettings);
            if (newSettings) {
              updateLocalSettings({
                inverted: newSettings.inverted,
                isInvertedGreen: newSettings.isInvertedGreen,
                isFourCorners: newSettings.isFourCorners,
              });
            }
          }}
          pageNumber={pageNumber}
          setPageNumber={setPageNumber}
          pageCount={pageCount}
          gridOn={gridOn}
          setGridOn={setGridOn}
          layers={layers}
          showLayerMenu={showLayerMenu}
          setShowLayerMenu={setShowLayerMenu}
          localTransform={localTransform}
          setLocalTransform={setLocalTransform}
          pageWidth={pageWidth}
          pageHeight={pageHeight}
          calibrationTransform={calibrationTransform}
        />

        <LayerMenu
          className={
            "absolute transition-all duration-700  " +
            (showLayerMenu ? "left-0" : "-left-60")
          }
          layers={layers}
          setLayers={setLayers}
        />

        <CalibrationCanvas
          className={`absolute z-10 ${visible(isCalibrating || gridOn)}`}
          points={points}
          setPoints={setPoints}
          pointToModify={pointToModify}
          setPointToModify={setPointToModify}
          perspective={calibrationTransform}
          width={+width}
          height={+height}
          isCalibrating={isCalibrating}
          ptDensity={ptDensity}
          transformSettings={transformSettings}
          setTransformSettings={setTransformSettings}
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
              filter: getInversionFilters(
                transformSettings.inverted,
                transformSettings.isInvertedGreen,
              ),
            }}
          >
            <div
              className={"border-8 border-purple-700"}
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
                setLayers={setLayers}
                layers={layers}
                setPageWidth={setPageWidth}
                setPageHeight={setPageHeight}
                setLocalTransform={setLocalTransform}
                calibrationTransform={calibrationTransform}
              />
            </div>
          </div>
        </Draggable>
      </FullScreen>
    </main>
  );
}
