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
  scaleTranslation
} from "@/_lib/geometry";
import isValidPDF from "@/_lib/is-valid-pdf";
import { Point } from "@/_lib/point";
import removeNonDigits from "@/_lib/remove-non-digits";
import {
  getDefaultDisplaySettings,
  DisplaySettings,
  OverlaySettings,
} from "@/_lib/display-settings";
import { IN, getPtDensity } from "@/_lib/unit";
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
import FlexWrapIcon from "@/_icons/flex-wrap-icon";
import {
  getDefaultMenuStates,
  getMenuStatesFromLayers,
  getMenuStatesFromPageCount,
  MenuStates,
} from "@/_lib/menu-states";

export default function Page() {
  // Default dimensions should be available on most cutting mats and large enough to get an accurate calibration
  const defaultWidthDimensionValue = "24";
  const defaultHeightDimensionValue = "16";
  const maxPoints = 4; // One point per vertex in rectangle

  const handle = useFullScreenHandle();

  const [points, setPoints] = useState<Point[]>([]);
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
  /* Layout size in pt (PDF units) */
  const [layoutWidthPt, setLayoutWidthPt] = useState<number>(0);
  const [layoutHeightPt, setLayoutHeightPt] = useState<number>(0);
  /* Layout size in units of measure (inches / cm) */
  const [layoutWidth, setLayoutWidth] = useState<number>(0);
  const [layoutHeight, setLayoutHeight] = useState<number>(0);

  const [lineThickness, setLineThickness] = useState<number>(0);
  const [measuring, setMeasuring] = useState<boolean>(false);

  const [pageRange, setPageRange] = useState<string>("");
  const [columnCount, setColumnCount] = useState<string>("");
  const [edgeInsets, setEdgeInsets] = useState<EdgeInsets>({
    horizontal: "0",
    vertical: "0",
  });

  const pdfRef = useRef<HTMLDivElement | null>(null);
  const [menuStates, setMenuStates] = useState<MenuStates>(
    getDefaultMenuStates(),
  );

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

  /* Reset the PDF position on unit change.
   * Prevents PDF from going off-screen after cm->in */
  useEffect(() => {
    setLocalTransform(Matrix.identity(3));
  }, [unitOfMeasure])

  useEffect(() => {
    const ptDensity = getPtDensity(unitOfMeasure);
    setLayoutWidth(layoutWidthPt / ptDensity);
  }, [layoutWidthPt, unitOfMeasure]);

  useEffect(() => {
    const ptDensity = getPtDensity(unitOfMeasure);
    setLayoutHeight(layoutHeightPt / ptDensity);
  }, [layoutHeightPt, unitOfMeasure]);

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
    setMenuStates((m) => getMenuStatesFromPageCount(m, pageCount));
  }, [pageCount]);

  useEffect(() => {
    setMenuStates((m) => getMenuStatesFromLayers(m, layers));
  }, [layers]);

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

      newDisplaySettings.overlay = localSettings.overlay ?? defaultDS.overlay;
      newDisplaySettings.inverted =
        localSettings.inverted ?? defaultDS.inverted;
      newDisplaySettings.isInvertedGreen =
        localSettings.isInvertedGreen ?? defaultDS.isInvertedGreen;
      newDisplaySettings.isFourCorners =
        localSettings.isFourCorners ?? defaultDS.isFourCorners;
      setDisplaySettings({ ...displaySettings, ...newDisplaySettings });
    }
  }, []);

  /* Scale of 1.0 would mean 1 in/cm per key press. Here it is 1/16th in/cm */
  useProgArrowKeyToMatrix(!isCalibrating, 1.0 / 16.0, (matrix) => {
    setLocalTransform(matrix.mmul(localTransform));
  });

  useEffect(() => {
    const ptDensity = getPtDensity(unitOfMeasure);
    const scaledTransform = scaleTranslation(localTransform, ptDensity);
    setMatrix3d(toMatrix3d(calibrationTransform.mmul(scaledTransform)));
  }, [localTransform, calibrationTransform, unitOfMeasure]);

  useEffect(() => {
    const ptDensity = getPtDensity(unitOfMeasure);
    const w = Number(width);
    const h = Number(height);
    if (points && points.length === maxPoints) {
      let m = getPerspectiveTransformFromPoints(points, w, h, 1.0, true);
      let n = getPerspectiveTransformFromPoints(points, w, h, ptDensity, false);
      setPerspective(m);
      setCalibrationTransform(n);
    }
  }, [points, width, height, unitOfMeasure]);

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
            lineThickness={lineThickness}
            setLineThickness={setLineThickness}
            setMenuStates={setMenuStates}
            menuStates={menuStates}
            measuring={measuring}
            setMeasuring={setMeasuring}
          />

          <StitchMenu
            showMenu={!isCalibrating && menuStates.stitch && menuStates.nav}
            setShowMenu={(showMenu) =>
              setMenuStates({ ...menuStates, stitch: showMenu })
            }
            setColumnCount={setColumnCount}
            setEdgeInsets={setEdgeInsets}
            setPageRange={setPageRange}
            columnCount={columnCount}
            edgeInsets={edgeInsets}
            pageRange={pageRange}
            pageCount={pageCount}
          />
          <LayerMenu
            visible={!isCalibrating && menuStates.layers}
            setVisible={(visible) =>
              setMenuStates({ ...menuStates, layers: visible })
            }
            layers={layers}
            setLayers={setLayers}
            className={`${menuStates.stitch ? "top-32" : "top-20"} overflow-scroll`}
          />
          {layers.size && !menuStates.layers ? (
            <Tooltip
              description={menuStates.layers ? t("layersOff") : t("layersOn")}
            >
              <IconButton
                className={`${menuStates.stitch ? "top-36" : "top-20"} absolute left-2 z-30 px-1.5 py-1.5 border-2 border-slate-400 transition-all duration-700`}
                onClick={() => setMenuStates({ ...menuStates, layers: true })}
              >
                <LayersIcon ariaLabel="layers" />
              </IconButton>
            </Tooltip>
          ) : null}

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
              className={visible(!isCalibrating)}
              perspective={perspective}
              calibrationTransform={calibrationTransform}
              unitOfMeasure={unitOfMeasure}
            />
          )}
          <Draggable
            viewportClassName={`select-none ${visible(!isCalibrating)} bg-white dark:bg-black transition-all duration-700 `}
            className={`select-none ${visible(!isCalibrating)}`}
            localTransform={localTransform}
            setLocalTransform={setLocalTransform}
            perspective={perspective}
          >
            <div
              ref={pdfRef}
              className={"absolute z-0"}
              style={{
                transform: `${matrix3d}`,
                transformOrigin: "0 0",
                filter: getInversionFilters(
                  displaySettings.inverted,
                  displaySettings.isInvertedGreen,
                ),
              }}
            >
              <div className={"outline outline-8 outline-purple-600"}>
                <PDFViewer
                  file={file}
                  setPageCount={setPageCount}
                  pageCount={pageCount}
                  setLayers={setLayers}
                  layers={layers}
                  setLayoutWidthPt={setLayoutWidthPt}
                  setLayoutHeightPt={setLayoutHeightPt}
                  lineThickness={lineThickness}
                  columnCount={columnCount}
                  edgeInsets={edgeInsets}
                  pageRange={pageRange}
                  setLocalTransform={setLocalTransform}
                />
              </div>
            </div>
          </Draggable>
        </FullScreen>
      </div>
    </main>
  );
}
