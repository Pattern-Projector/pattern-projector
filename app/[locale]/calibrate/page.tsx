"use client";

import { Matrix } from "ml-matrix";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useReducer,
  useState,
} from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import CalibrationCanvas from "@/_components/calibration-canvas";
import Draggable from "@/_components/draggable";
import Header from "@/_components/header";
import PDFViewer from "@/_components/pdf-viewer";
import { getPerspectiveTransformFromPoints, toMatrix3d } from "@/_lib/geometry";
import isValidPDF from "@/_lib/is-valid-pdf";
import { Point } from "@/_lib/point";
import removeNonDigits from "@/_lib/remove-non-digits";
import {
  getDefaultDisplaySettings,
  DisplaySettings,
  isDarkTheme,
  themeFilter,
} from "@/_lib/display-settings";
import { IN, getPtDensity } from "@/_lib/unit";
import { Layer } from "@/_lib/interfaces/layer";
import LayerMenu from "@/_components/layer-menu";
import useProgArrowKeyToMatrix from "@/_hooks/useProgArrowKeyToMatrix";
import { visible } from "@/_components/theme/css-functions";
import { IconButton } from "@/_components/buttons/icon-button";
import LayersIcon from "@/_icons/layers-icon";
import Tooltip from "@/_components/tooltip/tooltip";
import { useTranslations } from "next-intl";
import { EdgeInsets } from "@/_lib/interfaces/edge-insets";
import StitchMenu from "@/_components/stitch-menu";
import MeasureCanvas from "@/_components/measure-canvas";
import {
  getDefaultMenuStates,
  getMenuStatesFromLayers,
  getMenuStatesFromPageCount,
  MenuStates,
} from "@/_lib/menu-states";
import MovementPad from "@/_components/movement-pad";
import pointsReducer from "@/_reducers/pointsReducer";

export default function Page() {
  // Default dimensions should be available on most cutting mats and large enough to get an accurate calibration
  const defaultWidthDimensionValue = "24";
  const defaultHeightDimensionValue = "16";
  const maxPoints = 4; // One point per vertex in rectangle

  const handle = useFullScreenHandle();

  const [points, dispatch] = useReducer(pointsReducer, []);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(
    getDefaultDisplaySettings(),
  );
  const [width, setWidth] = useState(defaultWidthDimensionValue);
  const [height, setHeight] = useState(defaultHeightDimensionValue);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [perspective, setPerspective] = useState<Matrix>(Matrix.identity(3, 3));
  const [matrix3d, setMatrix3d] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [localTransform, setLocalTransform] = useState<Matrix>(
    Matrix.identity(3, 3),
  );
  const [calibrationTransform, setCalibrationTransform] = useState<Matrix>(
    Matrix.identity(3, 3),
  );
  const [pageCount, setPageCount] = useState<number>(1);
  const [unitOfMeasure, setUnitOfMeasure] = useState(IN);
  const [layers, setLayers] = useState<Map<string, Layer>>(new Map());
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

  const [menuStates, setMenuStates] = useState<MenuStates>(
    getDefaultMenuStates(),
  );
  const [showingMovePad, setShowingMovePad] = useState(true);
  const [corners, setCorners] = useState<Set<number>>(new Set([0]));

  function getDefaultPoints() {
    const { innerWidth, innerHeight } = window;
    const minX = innerWidth * 0.2;
    const minY = innerHeight * 0.2;
    const maxX = innerWidth * 0.8;
    const maxY = innerHeight * 0.8;
    return [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
    ];
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
      dispatch({ type: "set", points: JSON.parse(localPoints) });
    } else {
      dispatch({ type: "set", points: getDefaultPoints() });
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

      const defaults = getDefaultDisplaySettings();
      setDisplaySettings({
        overlay: localSettings.overlay ?? defaults.overlay,
        theme: localSettings.theme ?? defaults.theme,
      });
    }
  }, []);

  /* Scale of 1.0 would mean 1 in/cm per key press. Here it is 1/16th in/cm */
  useProgArrowKeyToMatrix(!isCalibrating, 1.0 / 16.0, (matrix) => {
    setLocalTransform(matrix.mmul(localTransform));
  });

  useEffect(() => {
    setMatrix3d(toMatrix3d(calibrationTransform.mmul(localTransform)));
  }, [localTransform, calibrationTransform]);

  useEffect(() => {
    const ptDensity = getPtDensity(unitOfMeasure);
    const w = Number(width);
    const h = Number(height);
    if (points && points.length === maxPoints) {
      let m = getPerspectiveTransformFromPoints(points, w, h, ptDensity, true);
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

  return (
    <main
      ref={noZoomRefCallback}
      className={`${isDarkTheme(displaySettings.theme) && "dark bg-black"} transition-all duration-700 w-full h-full absolute overflow-hidden touch-none`}
    >
      <div className="bg-white dark:bg-black dark:text-white w-full h-full">
        <FullScreen handle={handle} className="w-full h-full">
          {isCalibrating && showingMovePad && (
            <MovementPad
              corners={corners}
              setCorners={setCorners}
              dispatch={dispatch}
            />
          )}
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
            handleResetCalibration={() =>
              dispatch({ type: "set", points: getDefaultPoints() })
            }
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
                updateLocalSettings(newSettings);
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
            showingMovePad={showingMovePad}
            setShowingMovePad={setShowingMovePad}
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
            dispatch={dispatch}
            width={+width}
            height={+height}
            isCalibrating={isCalibrating}
            unitOfMeasure={unitOfMeasure}
            displaySettings={displaySettings}
            corners={corners}
            setCorners={setCorners}
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
              className={"absolute z-0"}
              style={{
                transform: `${matrix3d}`,
                transformOrigin: "0 0",
                filter: themeFilter(displaySettings.theme),
              }}
            >
              <div className={"outline outline-8 outline-purple-600"}>
                <PDFViewer
                  file={file}
                  setPageCount={setPageCount}
                  pageCount={pageCount}
                  setLayers={setLayers}
                  layers={layers}
                  setLayoutWidth={setLayoutWidth}
                  setLayoutHeight={setLayoutHeight}
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
