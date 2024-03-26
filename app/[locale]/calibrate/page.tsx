"use client";

import { Matrix, inverse } from "ml-matrix";
import { ChangeEvent, useCallback, useEffect, useState, useRef } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import CalibrationCanvas from "@/_components/calibration-canvas";
import Draggable from "@/_components/draggable";
import Header from "@/_components/header";
import PDFViewer from "@/_components/pdf-viewer";
import {
  getPerspectiveTransformFromPoints,
  toMatrix3d,
  decomposeTransformMatrix,
  scaleMatrixTranslation,
  overrideTranslationFromMatrix,
  translate,
} from "@/_lib/geometry";
import { OverlayMode } from "@/_lib/drawing";
import isValidPDF from "@/_lib/is-valid-pdf";
import { Point } from "@/_lib/point";
import removeNonDigits from "@/_lib/remove-non-digits";
import {
  getDefaultTransforms,
  TransformSettings,
} from "@/_lib/transform-settings";
import {
  getDefaultDisplaySettings,
  DisplaySettings,
	OverlaySettings
} from "@/_lib/display-settings";
import { CM, IN, getPtDensity } from "@/_lib/unit";
import { Layer } from "@/_lib/layer";
import LayerMenu from "@/_components/layer-menu";
import useProgArrowKeyToMatrix from "@/_hooks/useProgArrowKeyToMatrix";
import { visible } from "@/_components/theme/css-functions";
import { IconButton } from "@/_components/buttons/icon-button";
import LayersIcon from "@/_icons/layers-icon";
import Tooltip from "@/_components/tooltip/tooltip";
import { useTranslations } from "next-intl";
import { EdgeInsets } from "@/_lib/edge-insets";
import StitchMenu from "@/_components/stitch-menu";
import MeasureCanvas from "@/_components/measure-canvas";

export default function Page() {
  // Default dimensions should be available on most cutting mats and large enough to get an accurate calibration
  const defaultWidthDimensionValue = "24";
  const defaultHeightDimensionValue = "16";
  const maxPoints = 4; // One point per vertex in rectangle

  const handle = useFullScreenHandle();

  const [points, setPoints] = useState<Point[]>([]);
  const [transformSettings, setTransformSettings] = useState<TransformSettings>(
    getDefaultTransforms(),
  );
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(
    getDefaultDisplaySettings(),
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
    Matrix.identity(3, 3),
  );
  const [calibrationTransform, setCalibrationTransform] = useState<Matrix>(
    Matrix.identity(3, 3),
  );
  const [pageCount, setPageCount] = useState<number>(1);
  const [unitOfMeasure, setUnitOfMeasure] = useState(IN);
  const [layers, setLayers] = useState<Map<string, Layer>>(new Map());
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const [layoutWidth, setLayoutWidth] = useState<number>(0);
  const [layoutHeight, setLayoutHeight] = useState<number>(0);
  const [lineThickness, setLineThickness] = useState<number>(0);
  const [measuring, setMeasuring] = useState<boolean>(false);

  const [showStitchMenu, setShowStitchMenu] = useState<boolean>(false);
  const [pageRange, setPageRange] = useState<string>("");
  const [columnCount, setColumnCount] = useState<string>("");
  const [edgeInsets, setEdgeInsets] = useState<EdgeInsets>({
    horizontal: "",
    vertical: "",
  });

  const pdfRef = useRef<HTMLDivElement | null>(null);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });

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

  function resetTransformMatrix() {
    /* Resets and recenters the PDF */
    let newTransformMatrix = Matrix.identity(3,3);
    let tx = 0;
    let ty = 0;

    const scale = getPtDensity(unitOfMeasure) * .75;
		const pdfWidth = layoutWidth / scale;
		const pdfHeight = layoutHeight / scale;
		
		/* If pdf exceeds the width/height of the calibration
			 align it to left/top */
		if (pdfWidth > +width){
			tx = (pdfWidth-(+width)) * 0.5;
		}
		if (pdfHeight > +height){
			ty = (pdfHeight-(+height)) * 0.5;
		}
		
    const m = translate({ x: tx, y: ty});
    const recenteredMatrix = overrideTranslationFromMatrix(
      newTransformMatrix,
      m,
    );

    setTransformSettings({
      ...transformSettings,
      matrix: recenteredMatrix,
    });
  }

  const ptDensity = getPtDensity(unitOfMeasure);

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
  const t = useTranslations("Header");

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
    setColumnCount(String(pageCount));
    setPageRange(`1-${pageCount}`);
  }, [pageCount]);

  /* If the layout dimensions change, reset and recenter tranformation matrix */
  useEffect(() => {
    resetTransformMatrix();
  }, [layoutWidth, layoutHeight, unitOfMeasure]);

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

      const newDisplaySettings: {
        overlay?: OverlaySettings;
        inverted?: boolean;
        isInvertedGreen?: boolean;
        isFourCorners?: boolean;
      } = {};

      const defaultDS = getDefaultDisplaySettings();

      newDisplaySettings.overlay = localSettings.overlay !== undefined 
        ? localSettings.overlay : defaultDS.overlay;
      newDisplaySettings.inverted = localSettings.inverted !== undefined
        ? localSettings.inverted : defaultDS.inverted;
      newDisplaySettings.isInvertedGreen = localSettings.isInvertedGreen !== undefined
        ? localSettings.isInvertedGreen : defaultDS.isInvertedGreen;
      newDisplaySettings.isFourCorners = localSettings.isFourCorners !== undefined
        ? localSettings.isFourCorners : defaultDS.isFourCorners;
      setDisplaySettings({ ...displaySettings, ...newDisplaySettings });
    }
  }, []);

  /* Scale of 1.0 would mean 1 in/cm per key press. Here it is 1/16th in or  1 mm */
  const arrowKeyScale = unitOfMeasure == IN ? 16.0 : 10.0;
  useProgArrowKeyToMatrix(!isCalibrating, arrowKeyScale, (matrix) => {
    const newTransformMatrix = matrix.mmul(transformSettings.matrix);
    setTransformSettings({
      ...transformSettings,
      matrix: newTransformMatrix,
    });
  });

  useEffect(() => {
    /* Combine the translation portion of tranformSettings
     * with the localTransformMatrix. Note that the transformSettings
     * matrix must be scaled by ptDensity first */

    const pdfWidth = pdfDimensions.width;
    const pdfHeight = pdfDimensions.height;
    const translateToCenter = translate({
      x: -pdfWidth / 2,
      y: -pdfHeight / 2,
    });

    const ptDensity = getPtDensity(unitOfMeasure);
    const scaled = scaleMatrixTranslation(transformSettings.matrix, ptDensity);

    const m0 = localTransform.mmul(scaled);
    const m1 = translateToCenter.mmul(m0);
    setMatrix3d(toMatrix3d(m1));
  }, [localTransform, transformSettings, unitOfMeasure, pdfDimensions]);

  /* Update the pdfWidth and pdfHeight when it changes */
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        /* Only trigger if the dimension is non-zero
         * and different that the current dimension */
        if (
          width !== 0 &&
          height !== 0 &&
          (width != pdfDimensions.width || height != pdfDimensions.height)
        )
          setPdfDimensions({ width, height });
      }
    });

    if (pdfRef.current) {
      observer.observe(pdfRef.current);
    }

    return () => {
      if (pdfRef.current) {
        observer.unobserve(pdfRef.current);
      }
    };
  }, [pdfDimensions]);

  useEffect(() => {
    const ptDensity = getPtDensity(unitOfMeasure);
    const w = Number(width);
    const h = Number(height);
    if (points && points.length === maxPoints) {
      let m = getPerspectiveTransformFromPoints(points, w, h, ptDensity, true);
      let n = getPerspectiveTransformFromPoints(points, w, h, ptDensity, false);
      setPerspective(m);
      setLocalTransform(n);
      setCalibrationTransform(n);
    }
  }, [points, width, height, unitOfMeasure]);

  useEffect(() => {
    if (layers.size > 0) {
      setShowLayerMenu(true);
    } else {
      setShowLayerMenu(false);
    }
  }, [layers]);

  const noZoomRefCallback = useCallback((element: HTMLElement | null) => {
    if (element === null) {
      return;
    }
    element.addEventListener("wheel", (e) => e.ctrlKey && e.preventDefault(), {
      passive: false,
    });
  }, []);

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
      ref={noZoomRefCallback}
      className={`${(displaySettings.inverted || displaySettings.isInvertedGreen) && "dark"} w-full h-full absolute overflow-hidden touch-none`}
    >
      <div className="bg-white dark:bg-black dark:text-white">
        <FullScreen handle={handle}>
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
            setTransformSettings={setTransformSettings}
            displaySettings={displaySettings}
            setDisplaySettings={(newSettings) => {
              setDisplaySettings(newSettings);
              if (newSettings) {
                updateLocalSettings({
                  overlay: newSettings.overlay,
                  inverted: newSettings.inverted,
                  isInvertedGreen: newSettings.isInvertedGreen,
                  isFourCorners: newSettings.isFourCorners,
                });
              }
            }}
            pageCount={pageCount}
            localTransform={localTransform}
            setLocalTransform={setLocalTransform}
            layoutWidth={layoutWidth}
            layoutHeight={layoutHeight}
            calibrationTransform={calibrationTransform}
            lineThickness={lineThickness}
            setLineThickness={setLineThickness}
            setShowStitchMenu={setShowStitchMenu}
            showStitchMenu={showStitchMenu}
            measuring={measuring}
            setMeasuring={setMeasuring}
          />

          <LayerMenu
            visible={!isCalibrating && showLayerMenu}
            setVisible={(visible) => setShowLayerMenu(visible)}
            layers={layers}
            setLayers={setLayers}
            className={`${showStitchMenu ? "top-72" : "top-20"} overflow-scroll`}
          />
          {layers.size && !showLayerMenu ? (
            <Tooltip
              description={showLayerMenu ? t("layersOff") : t("layersOn")}
            >
              <IconButton
                className={`${showStitchMenu ? "top-72" : "top-20"} absolute left-2 z-30 px-1.5 py-1.5 border-2 border-slate-400`}
                onClick={() => setShowLayerMenu(true)}
              >
                <LayersIcon ariaLabel="layers" />
              </IconButton>
            </Tooltip>
          ) : null}
          <StitchMenu
            className={`${visible(!isCalibrating && showStitchMenu)} absolute left-0 top-16 z-30 w-48 transition-all duration-700 ${showStitchMenu ? "right-0" : "-right-60"}`}
            setColumnCount={setColumnCount}
            setEdgeInsets={setEdgeInsets}
            setPageRange={setPageRange}
            columnCount={columnCount}
            edgeInsets={edgeInsets}
            pageRange={pageRange}
            pageCount={pageCount}
          />

          <CalibrationCanvas
            className={`absolute z-10`}
            points={points}
            setPoints={setPoints}
            pointToModify={pointToModify}
            setPointToModify={setPointToModify}
            width={+width}
            height={+height}
            isCalibrating={isCalibrating}
            unitOfMeasure={unitOfMeasure}
            displaySettings={displaySettings}
            setDisplaySettings={setDisplaySettings}
          />
          {measuring && (
            <MeasureCanvas
              perspective={perspective}
              calibrationTransform={calibrationTransform}
              unitOfMeasure={unitOfMeasure}
            />
          )}
          <Draggable
            viewportClassName={`select-none ${visible(!isCalibrating)} bg-white dark:bg-black transition-all duration-700 `}
            className={`select-none ${visible(!isCalibrating)}`}
            transformSettings={transformSettings}
            setTransformSettings={setTransformSettings}
            perspective={perspective}
            unitOfMeasure={unitOfMeasure}
          >
            <div
              ref={pdfRef}
              className={"absolute z-0"}
              style={{
                transform: `${matrix3d}`,
                transformOrigin: "center",
                filter: getInversionFilters(
                  displaySettings.inverted,
                  displaySettings.isInvertedGreen,
                ),
              }}
            >
              <div className={"border-8 border-purple-700"}>
                <PDFViewer
                  file={file}
                  setPageCount={setPageCount}
                  pageCount={pageCount}
                  setLayers={setLayers}
                  layers={layers}
                  setLayoutWidth={setLayoutWidth}
                  setLayoutHeight={setLayoutHeight}
                  onDocumentLoad={resetTransformMatrix}
                  calibrationTransform={calibrationTransform}
                  lineThickness={lineThickness}
                  columnCount={columnCount}
                  edgeInsets={edgeInsets}
                  pageRange={pageRange}
                />
              </div>
            </div>
          </Draggable>
        </FullScreen>
      </div>
    </main>
  );
}
