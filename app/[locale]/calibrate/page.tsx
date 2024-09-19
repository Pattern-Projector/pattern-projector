"use client";

import { Matrix, inverse } from "ml-matrix";
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import CalibrationCanvas from "@/_components/calibration-canvas";
import Draggable from "@/_components/draggable";
import Header from "@/_components/header";
import {
  RestoreTransforms,
  getCalibrationCenterPoint,
  getPerspectiveTransformFromPoints,
} from "@/_lib/geometry";
import isValidPDF from "@/_lib/is-valid-pdf";
import removeNonDigits from "@/_lib/remove-non-digits";
import {
  DisplaySettings,
  getDefaultDisplaySettings,
  isDarkTheme,
  themeFilter,
} from "@/_lib/display-settings";
import { getPtDensity, IN } from "@/_lib/unit";
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
  getCalibrationContextUpdatedWithEvent,
  getIsInvalidatedCalibrationContext,
  getIsInvalidatedCalibrationContextWithPointerEvent,
  logCalibrationContextDifferences,
} from "@/_lib/calibration-context";
import WarningIcon from "@/_icons/warning-icon";
import PdfViewer from "@/_components/pdf-viewer";
import { Transformable } from "@/_hooks/use-transform-context";
import OverlayCanvas from "@/_components/overlay-canvas";
import stitchSettingsReducer from "@/_reducers/stitchSettingsReducer";
import { StitchSettings } from "@/_lib/interfaces/stitch-settings";
import Tooltip from "@/_components/tooltip/tooltip";
import { IconButton } from "@/_components/buttons/icon-button";
import FullScreenExitIcon from "@/_icons/full-screen-exit-icon";
import FullScreenIcon from "@/_icons/full-screen-icon";
import { Layers } from "@/_lib/layers";
import useLayers from "@/_hooks/use-layers";
import ExpandMoreIcon from "@/_icons/expand-more-icon";
import { LoadStatusEnum } from "@/_lib/load-status-enum";
import LoadingSpinner from "@/_icons/loading-spinner";
import { Point } from "@/_lib/point";
import TroubleshootingButton from "@/_components/troubleshooting-button";
import { ButtonColor } from "@/_components/theme/colors";

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
  const [pdfLoadStatus, setPdfLoadStatus] = useState<LoadStatusEnum>(
    LoadStatusEnum.DEFAULT,
  );
  const [lineThicknessStatus, setLineThicknessStatus] =
    useState<LoadStatusEnum>(LoadStatusEnum.DEFAULT);
  const [perspective, setPerspective] = useState<Matrix>(Matrix.identity(3, 3));
  const [file, setFile] = useState<File | null>(null);
  const [calibrationTransform, setCalibrationTransform] = useState<Matrix>(
    Matrix.identity(3, 3),
  );
  const [restoreTransforms, setRestoreTransforms] =
    useState<RestoreTransforms | null>(null);
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
  const [magnifying, setMagnifying] = useState<boolean>(false);
  const [zoomedOut, setZoomedOut] = useState<boolean>(false);
  const [menusHidden, setMenusHidden] = useState<boolean>(false);
  const [isIdle, setIsIdle] = useState(false);

  const [menuStates, setMenuStates] = useState<MenuStates>(
    getDefaultMenuStates(),
  );
  const [showingMovePad, setShowingMovePad] = useState(false);
  const [corners, setCorners] = useState<Set<number>>(new Set([0]));
  const [showCalibrationAlert, setShowCalibrationAlert] = useState(false);
  const [fullScreenTooltipVisible, setFullScreenTooltipVisible] =
    useState(true);

  const [troubleshooting, setTroubleshooting] = useState(false);
  const [buttonColor, setButtonColor] = useState<ButtonColor>(
    ButtonColor.PURPLE,
  );

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const t = useTranslations("Header");

  const IDLE_TIMEOUT = 8000;

  function resetIdle() {
    setIsIdle(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
    }, IDLE_TIMEOUT);
  }

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
      setPdfLoadStatus(LoadStatusEnum.LOADING);
      setRestoreTransforms(null);
      setZoomedOut(false);
      setMagnifying(false);
      setMeasuring(false);
      setPageCount(0);
      const lineThicknessString = localStorage.getItem(
        `lineThickness:${files[0].name}`,
      );
      if (lineThicknessString !== null) {
        setLineThickness(Number(lineThicknessString));
      } else {
        setLineThickness(0);
      }

      const key = `stitchSettings:${files[0].name ?? "default"}`;
      const stitchSettingsString = localStorage.getItem(key);
      if (stitchSettingsString !== null) {
        const stitchSettings = JSON.parse(stitchSettingsString);
        dispatchStitchSettings({ type: "set", stitchSettings });
      } else {
        dispatchStitchSettings({
          type: "set",
          stitchSettings: {
            ...defaultStitchSettings,
            key,
          },
        });
      }
      const m = getPerspectiveTransformFromPoints(
        points,
        Number(width),
        Number(height),
        getPtDensity(unitOfMeasure),
        false,
      );

      setCalibrationTransform(m);
      setPerspective(inverse(m));
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
    if (points.length === maxPoints) {
      const m = getPerspectiveTransformFromPoints(
        points,
        Number(width),
        Number(height),
        getPtDensity(unitOfMeasure),
        false,
      );

      setCalibrationTransform(m);
      setPerspective(inverse(m));
    }
  }, [points, width, height, unitOfMeasure]);

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

    // const s = window.location.host.split(".")[0];
    // if (s.localeCompare("beta") === 0) {
    //   setButtonColor(ButtonColor.BLUE);
    // }
    // if (s.localeCompare("old") === 0) {
    //   setButtonColor(ButtonColor.GREEN);
    // }
  }, []);

  const noZoomRefCallback = useCallback((element: HTMLElement | null) => {
    if (element === null) {
      return;
    }
    element.addEventListener("wheel", (e) => e.ctrlKey && e.preventDefault(), {
      passive: false,
    });
  }, []);

  function handlePointerDown(e: React.PointerEvent) {
    resetIdle();
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
          logCalibrationContextDifferences(expected, fullScreenHandle.active);
          setCalibrationValidated(false);
        }
      }
    }

    setMenusHidden(false);
  }

  function handlePointerMove(e: React.PointerEvent) {
    // Chromebook triggers move after menu hides #268
    if (e.movementX === 0 && e.movementY === 0) {
      return;
    }
    resetIdle();
    setMenusHidden(false);
  }

  useEffect(() => {
    const projectingWithInvalidContext =
      !isCalibrating && !calibrationValidated;
    setShowCalibrationAlert(projectingWithInvalidContext);
  }, [isCalibrating, calibrationValidated]);

  useEffect(() => {
    setMenusHidden(
      isIdle &&
        !isCalibrating &&
        !zoomedOut &&
        file !== null &&
        pdfLoadStatus !== LoadStatusEnum.LOADING,
    );
  }, [isIdle, isCalibrating, zoomedOut, file, pdfLoadStatus]);

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
      onPointerMove={handlePointerMove}
      ref={noZoomRefCallback}
      className={`${menusHidden && "cursor-none"} ${isDarkTheme(displaySettings.theme) && "dark bg-black"} w-screen h-screen absolute overflow-hidden touch-none`}
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
                    <FullScreenIcon ariaLabel={t("fullscreen")} />
                  ) : (
                    <FullScreenExitIcon ariaLabel={t("fullscreenExit")} />
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
              gridCenter={getCalibrationCenterPoint(
                +width,
                +height,
                unitOfMeasure,
              )}
              zoomedOut={zoomedOut}
              menusHidden={menusHidden}
              menuStates={menuStates}
            >
              <Draggable
                className={`absolute ${menusHidden && "!cursor-none"} `}
                perspective={perspective}
                isCalibrating={isCalibrating}
                unitOfMeasure={unitOfMeasure}
                calibrationTransform={calibrationTransform}
                setCalibrationTransform={setCalibrationTransform}
                setPerspective={setPerspective}
                magnifying={magnifying}
                setMagnifying={setMagnifying}
                setRestoreTransforms={setRestoreTransforms}
                restoreTransforms={restoreTransforms}
                zoomedOut={zoomedOut}
                setZoomedOut={setZoomedOut}
                layoutWidth={layoutWidth}
                layoutHeight={layoutHeight}
                calibrationCenter={getCalibrationCenterPoint(
                  +width,
                  +height,
                  unitOfMeasure,
                )}
                menuStates={menuStates}
                file={file}
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
                  setLineThicknessStatus={setLineThicknessStatus}
                  setPdfLoadStatus={setPdfLoadStatus}
                  magnifying={magnifying}
                  gridCenter={getCalibrationCenterPoint(
                    +width,
                    +height,
                    unitOfMeasure,
                  )}
                />
              </Draggable>
              <OverlayCanvas
                className={`absolute top-0 pointer-events-none`}
                points={points}
                width={+width}
                height={+height}
                unitOfMeasure={unitOfMeasure}
                displaySettings={displaySettings}
                calibrationTransform={calibrationTransform}
                zoomedOut={zoomedOut}
                magnifying={magnifying}
                restoreTransforms={restoreTransforms}
              />
            </MeasureCanvas>

            <menu
              className={`absolute w-screen ${visible(!menusHidden)} ${menuStates.nav ? "top-0" : "-top-16"} pointer-events-none`}
            >
              <menu className="pointer-events-auto">
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
                  layoutWidth={layoutWidth}
                  layoutHeight={layoutHeight}
                  lineThickness={lineThickness}
                  setLineThickness={(newLineThickness) => {
                    setLineThickness(newLineThickness);
                    if (file) {
                      localStorage.setItem(
                        `lineThickness:${file.name}`,
                        String(newLineThickness),
                      );
                    }
                  }}
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
                  magnifying={magnifying}
                  setMagnifying={setMagnifying}
                  zoomedOut={zoomedOut}
                  setZoomedOut={setZoomedOut}
                  pdfLoadStatus={pdfLoadStatus}
                  lineThicknessStatus={lineThicknessStatus}
                  buttonColor={buttonColor}
                />
                {isCalibrating && (
                  <TroubleshootingButton
                    troubleshooting={troubleshooting}
                    setTroubleshooting={setTroubleshooting}
                  />
                )}
              </menu>

              <menu
                className={`${visible(!isCalibrating && file !== null)} p-0`}
              >
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
                  menuStates={menuStates}
                  setMenuStates={setMenuStates}
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
            <IconButton
              className={`${visible(!menusHidden)} !p-1 m-0 border-2 border-black dark:border-white absolute ${menuStates.nav ? "-top-16" : "top-2"} left-1/4 focus:ring-0`}
              onClick={() => setMenuStates({ ...menuStates, nav: true })}
            >
              <ExpandMoreIcon ariaLabel={t("menuShow")} />
            </IconButton>
            {!isCalibrating && pdfLoadStatus === LoadStatusEnum.LOADING ? (
              <LoadingSpinner
                height={100}
                width={100}
                className="absolute left-1/2 top-1/2"
              />
            ) : null}
          </Transformable>
        </FullScreen>
      </div>
      <Filters />
    </main>
  );
}
