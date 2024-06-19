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
import {
  getCenterPoint,
  getPerspectiveTransformFromPoints,
} from "@/_lib/geometry";
import isValidPDF from "@/_lib/is-valid-pdf";
import removeNonDigits from "@/_lib/remove-non-digits";
import {
  getDefaultDisplaySettings,
  DisplaySettings,
  isDarkTheme,
  themeFilter,
} from "@/_lib/display-settings";
import { IN, getPtDensity } from "@/_lib/unit";
import LayerMenu from "@/_components/layer-menu";
import { visible } from "@/_components/theme/css-functions";
import { useTranslations } from "next-intl";
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
import Filters from "@/_components/filters";
import CalibrationContext, {
  getCalibrationContext,
  getIsInvalidatedCalibrationContext,
  getIsInvalidatedCalibrationContextWithPointerEvent,
} from "@/_lib/calibration-context";
import WarningIcon from "@/_icons/warning-icon";
import PdfViewer from "@/_components/pdf-viewer";
import { Transformable } from "@/_hooks/use-transform-context";
import OverlayCanvas from "@/_components/overlay-canvas";
import stitchSettingsReducer from "@/_reducers/stitchSettingsReducer";
import { StitchSettings } from "@/_lib/interfaces/stitch-settings";
import Tooltip from "@/_components/tooltip/tooltip";
import { IconButton } from "@/_components/buttons/icon-button";
import FullscreenExitIcon from "@/_icons/fullscreen-exit-icon";
import { Layers } from "@/_lib/layers";
import useLayers from "@/_hooks/use-layers";

const defaultStitchSettings = {
  columnCount: 1,
  edgeInsets: { horizontal: 0, vertical: 0 },
  pageRange: "1-",
} as StitchSettings;

export default function Page() {
  // Default dimensions should be available on most cutting mats and large enough to get an accurate calibration
  const defaultWidthDimensionValue = "24";
  const defaultHeightDimensionValue = "16";

  const maxPoints = 4; // One point per vertex in rectangle

  const fullScreenHandle = useFullScreenHandle();

  const [points, dispatch] = useReducer(pointsReducer, []);
  const [stitchSettings, dispatchStitchSettings] = useReducer(
    stitchSettingsReducer,
    defaultStitchSettings,
  );
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(
    getDefaultDisplaySettings(),
  );
  const [calibrationValidated, setCalibrationValidated] =
    useState<boolean>(false);
  const [width, setWidth] = useState(defaultWidthDimensionValue);
  const [height, setHeight] = useState(defaultHeightDimensionValue);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [perspective, setPerspective] = useState<Matrix>(Matrix.identity(3, 3));
  const [file, setFile] = useState<File | null>(null);
  const [calibrationTransform, setCalibrationTransform] = useState<Matrix>(
    Matrix.identity(3, 3),
  );
  const [pageCount, setPageCount] = useState<number>(0);
  const [unitOfMeasure, setUnitOfMeasure] = useState(IN);
  const { layers, dispatchLayersAction } = useLayers(file?.name ?? "default");
  const setLayers = useCallback(
    (l: Layers) => dispatchLayersAction({ type: "set-layers", layers: l }),
    [dispatchLayersAction],
  );
  const [layoutWidth, setLayoutWidth] = useState<number>(0);
  const [layoutHeight, setLayoutHeight] = useState<number>(0);
  const [lineThickness, setLineThickness] = useState<number>(0);
  const [measuring, setMeasuring] = useState<boolean>(false);

  const [menuStates, setMenuStates] = useState<MenuStates>(
    getDefaultMenuStates(),
  );
  const [showingMovePad, setShowingMovePad] = useState(false);
  const [corners, setCorners] = useState<Set<number>>(new Set([0]));
  const [showCalibrationAlert, setShowCalibrationAlert] = useState(false);
  const [fullScreenTooltipVisible, setFullScreenTooltipVisible] =
    useState(true);

  const t = useTranslations("Header");

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
      setLineThickness(0);
    }

    const expectedContext = localStorage.getItem("calibrationContext");
    if (expectedContext !== null) {
      const expected = JSON.parse(expectedContext) as CalibrationContext;
      if (expected.fullScreen) {
        fullScreenHandle.enter();
      }
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
    const element = document.getElementById("bmc-wbtn");
    if (element) {
      element.style.display = "none";
    }
  }, []);

  useEffect(() => {
    setMenuStates((m) => getMenuStatesFromPageCount(m, pageCount));
  }, [pageCount]);

  useEffect(() => {
    // If the file changes, get stitch settings for that file from localStorage
    if (!file) {
      return;
    }
    setPageCount(0); // Reset page count while loading
    const key = `stitchSettings:${file.name ?? "default"}`;
    const stitchSettingsString = localStorage.getItem(key);
    if (stitchSettingsString !== null) {
      const stitchSettings = JSON.parse(stitchSettingsString);
      dispatchStitchSettings({ type: "set", stitchSettings });
      return;
    }
    dispatchStitchSettings({
      type: "set",
      stitchSettings: {
        ...defaultStitchSettings,
        key,
      },
    });
  }, [file]);

  useEffect(() => {
    setMenuStates((m) => getMenuStatesFromLayers(m, layers));
  }, [layers]);

  useEffect(() => {
    const localPoints = localStorage.getItem("points");
    if (localPoints !== null) {
      dispatch({ type: "initialize", points: JSON.parse(localPoints) });
    } else {
      dispatch({ type: "initialize", points: getDefaultPoints() });
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
      const isTouchDevice = "ontouchstart" in window;
      if (localSettings.showingMovePad !== undefined) {
        setShowingMovePad(localSettings.showingMovePad);
      } else {
        setShowingMovePad(isTouchDevice);
      }

      const defaults = getDefaultDisplaySettings();
      setDisplaySettings({
        overlay: localSettings.overlay ?? defaults.overlay,
        theme: localSettings.theme ?? defaults.theme,
      });
    }
  }, []);

  useEffect(() => {
    const ptDensity = getPtDensity(unitOfMeasure);
    const w = Number(width);
    const h = Number(height);
    if (points && points.length === maxPoints) {
      const m = getPerspectiveTransformFromPoints(
        points,
        w,
        h,
        ptDensity,
        true,
      );
      const n = getPerspectiveTransformFromPoints(
        points,
        w,
        h,
        ptDensity,
        false,
      );
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

  function handlePointerDown(e: React.PointerEvent) {
    if (fullScreenTooltipVisible) {
      setFullScreenTooltipVisible(false);
    }

    if (calibrationValidated) {
      const expectedContext = localStorage.getItem("calibrationContext");
      if (expectedContext === null) {
        setCalibrationValidated(false);
      } else {
        const expected = JSON.parse(expectedContext) as CalibrationContext;
        if (
          getIsInvalidatedCalibrationContextWithPointerEvent(
            expected,
            e,
            fullScreenHandle.active,
          )
        ) {
          setCalibrationValidated(false);
        }
      }
    }
  }

  useEffect(() => {
    const projectingWithInvalidContext =
      !isCalibrating && !calibrationValidated;
    setShowCalibrationAlert(projectingWithInvalidContext);
  }, [isCalibrating, calibrationValidated]);

  useEffect(() => {
    const interval = setInterval(() => {
      const calibrationContext = localStorage.getItem("calibrationContext");
      if (calibrationContext === null) {
        if (calibrationValidated) {
          setCalibrationValidated(false);
        }
      } else {
        const expected = JSON.parse(calibrationContext) as CalibrationContext;
        const isInvalid = getIsInvalidatedCalibrationContext(
          expected,
          fullScreenHandle.active,
        );
        if (isInvalid === calibrationValidated) {
          setCalibrationValidated(!isInvalid);
        }
      }
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, [calibrationValidated, setCalibrationValidated, fullScreenHandle.active]);

  return (
    <main
      onPointerDown={handlePointerDown}
      ref={noZoomRefCallback}
      className={`${isDarkTheme(displaySettings.theme) && "dark bg-black"} w-screen h-screen absolute overflow-hidden touch-none`}
    >
      <div className="bg-white dark:bg-black dark:text-white w-screen h-screen ">
        <FullScreen
          handle={fullScreenHandle}
          className="bg-white dark:bg-black transition-all duration-500 w-screen h-screen"
        >
          {showCalibrationAlert ? (
            <h2 className="flex items-center gap-4 absolute left-1/4 top-1/2 w-1/2 bg-white dark:bg-black dark:text-white z-[150] p-4 rounded border-2 border-black dark:border-white">
              <div className="flex">
                <WarningIcon ariaLabel="warning" />
              </div>
              {t("calibrationAlert")}
              <Tooltip
                description={
                  fullScreenHandle.active
                    ? t("fullscreenExit")
                    : t("fullscreen")
                }
              >
                <IconButton
                  onClick={
                    fullScreenHandle.active
                      ? fullScreenHandle.exit
                      : fullScreenHandle.enter
                  }
                >
                  {fullScreenHandle.active ? (
                    <FullscreenExitIcon ariaLabel={t("fullscreen")} />
                  ) : (
                    <FullscreenExitIcon ariaLabel={t("fullscreenExit")} />
                  )}
                </IconButton>
              </Tooltip>
            </h2>
          ) : null}
          {isCalibrating && (
            <CalibrationCanvas
              className={`absolute ${visible(isCalibrating)}`}
              points={points}
              dispatch={dispatch}
              width={+width}
              height={+height}
              isCalibrating={isCalibrating}
              unitOfMeasure={unitOfMeasure}
              displaySettings={displaySettings}
              corners={corners}
              setCorners={setCorners}
              fullScreenHandle={fullScreenHandle}
            />
          )}
          {isCalibrating && showingMovePad && (
            <MovementPad
              corners={corners}
              setCorners={setCorners}
              dispatch={dispatch}
              fullScreenHandle={fullScreenHandle}
            />
          )}

          <Transformable fileName={file?.name ?? "default"}>
            <MeasureCanvas
              className={visible(!isCalibrating)}
              perspective={perspective}
              calibrationTransform={calibrationTransform}
              unitOfMeasure={unitOfMeasure}
              measuring={measuring}
              setMeasuring={setMeasuring}
              file={file}
              gridCenter={getCenterPoint(+width, +height, unitOfMeasure)}
            >
              <Draggable
                className={`absolute`}
                perspective={perspective}
                isCalibrating={isCalibrating}
                unitOfMeasure={unitOfMeasure}
                calibrationTransform={calibrationTransform}
              >
                <PdfViewer
                  file={file}
                  setPageCount={setPageCount}
                  pageCount={pageCount}
                  setLayers={setLayers}
                  layers={layers}
                  setLayoutWidth={setLayoutWidth}
                  setLayoutHeight={setLayoutHeight}
                  lineThickness={lineThickness}
                  stitchSettings={stitchSettings}
                  filter={themeFilter(displaySettings.theme)}
                  dispatchStitchSettings={dispatchStitchSettings}
                />
              </Draggable>
              <OverlayCanvas
                className="absolute top-0 pointer-events-none"
                points={points}
                width={+width}
                height={+height}
                unitOfMeasure={unitOfMeasure}
                displaySettings={displaySettings}
              />
            </MeasureCanvas>

            <menu className={`absolute top-0 w-screen`}>
              <Header
                isCalibrating={isCalibrating}
                setIsCalibrating={setIsCalibrating}
                height={height}
                width={width}
                handleHeightChange={handleHeightChange}
                handleWidthChange={handleWidthChange}
                handleResetCalibration={() => {
                  localStorage.setItem(
                    "calibrationContext",
                    JSON.stringify(
                      getCalibrationContext(fullScreenHandle.active),
                    ),
                  );
                  dispatch({ type: "set", points: getDefaultPoints() });
                }}
                handleFileChange={handleFileChange}
                fullScreenHandle={fullScreenHandle}
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
                layoutWidth={layoutWidth}
                layoutHeight={layoutHeight}
                lineThickness={lineThickness}
                setLineThickness={setLineThickness}
                setMenuStates={setMenuStates}
                menuStates={menuStates}
                measuring={measuring}
                setMeasuring={setMeasuring}
                showingMovePad={showingMovePad}
                setShowingMovePad={(show) => {
                  setShowingMovePad(show);
                  updateLocalSettings({ showingMovePad: show });
                }}
                setCalibrationValidated={setCalibrationValidated}
                fullScreenTooltipVisible={fullScreenTooltipVisible}
              />
              <menu className={`${visible(!isCalibrating && file !== null)}`}>
                <StitchMenu
                  className={`${menuStates.stitch && menuStates.nav ? "opacity-100 block" : "opacity-0 hidden"}`}
                  setShowMenu={(showMenu) =>
                    setMenuStates({ ...menuStates, stitch: showMenu })
                  }
                  dispatchStitchSettings={dispatchStitchSettings}
                  stitchSettings={stitchSettings}
                  pageCount={pageCount}
                  file={file}
                  layers={layers}
                />
                <LayerMenu
                  visible={menuStates.layers}
                  setVisible={(visible) =>
                    setMenuStates({ ...menuStates, layers: visible })
                  }
                  layers={layers}
                  dispatchLayerAction={dispatchLayersAction}
                />
              </menu>
            </menu>
          </Transformable>
        </FullScreen>
      </div>
      <Filters />
    </main>
  );
}
