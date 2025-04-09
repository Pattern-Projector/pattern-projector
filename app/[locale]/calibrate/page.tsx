"use client";

import { Matrix, inverse } from "ml-matrix";
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import CalibrationCanvas from "@/_components/canvases/calibration-canvas";
import Draggable from "@/_components/draggable";
import Header from "@/_components/header";
import {
  RestoreTransforms,
  checkIsConcave,
  getCalibrationCenterPoint,
  getPerspectiveTransformFromPoints,
} from "@/_lib/geometry";
import isValidFile from "@/_lib/is-valid-file";
import removeNonDigits from "@/_lib/remove-non-digits";
import {
  DisplaySettings,
  getDefaultDisplaySettings,
  isDarkTheme,
  themeFilter,
  Theme,
} from "@/_lib/display-settings";
import { getPtDensity, IN } from "@/_lib/unit";
import { visible } from "@/_components/theme/css-functions";
import { useTranslations } from "next-intl";
import MeasureCanvas from "@/_components/canvases/measure-canvas";
import { getDefaultMenuStates, MenuStates } from "@/_lib/menu-states";
import MovementPad from "@/_components/movement-pad";
import pointsReducer from "@/_reducers/pointsReducer";
import Filters from "@/_components/filters";
import CalibrationContext, {
  getCalibrationContext,
  getIsInvalidatedCalibrationContext,
  getIsInvalidatedCalibrationContextWithPointerEvent,
  logCalibrationContextDifferences,
} from "@/_lib/calibration-context";
import WarningIcon from "@/_icons/warning-icon";
import PdfViewer from "@/_components/pdf-viewer";
import { Transformable } from "@/_hooks/use-transform-context";
import OverlayCanvas from "@/_components/canvases/overlay-canvas";
import stitchSettingsReducer from "@/_reducers/stitchSettingsReducer";
import {
  LineDirection,
  StitchSettings,
} from "@/_lib/interfaces/stitch-settings";
import { IconButton } from "@/_components/buttons/icon-button";
import FullScreenExitIcon from "@/_icons/full-screen-exit-icon";
import FullScreenIcon from "@/_icons/full-screen-icon";
import { Layers } from "@/_lib/layers";
import useLayers from "@/_hooks/use-layers";
import ExpandMoreIcon from "@/_icons/expand-more-icon";
import { LoadStatusEnum } from "@/_lib/load-status-enum";
import LoadingSpinner from "@/_icons/loading-spinner";
import TroubleshootingButton from "@/_components/troubleshooting-button";
import { ButtonColor } from "@/_components/theme/colors";
import MailModal from "@/_components/mail-modal";
import SideMenu from "@/_components/menus/side-menu";
import PatternScaleReducer from "@/_reducers/patternScaleReducer";
import Modal from "@/_components/modal/modal";
import { ModalTitle } from "@/_components/modal/modal-title";
import ModalContent from "@/_components/modal/modal-content";
import { ModalText } from "@/_components/modal/modal-text";
import { ModalActions } from "@/_components/modal/modal-actions";
import { Button } from "@/_components/buttons/button";
import { erosionFilter } from "@/_lib/erode";
import SvgViewer from "@/_components/svg-viewer";
import { toggleFullScreen } from "@/_lib/full-screen";

const defaultStitchSettings = {
  lineCount: 1,
  edgeInsets: { horizontal: 0, vertical: 0 },
  pageRange: "1-",
  lineDirection: LineDirection.Column,
} as StitchSettings;

export default function Page() {
  // Default dimensions should be available on most cutting mats and large enough to get an accurate calibration
  const defaultWidthDimensionValue = "24";
  const defaultHeightDimensionValue = "16";

  const maxPoints = 4; // One point per vertex in rectangle

  const fullScreenHandle = useFullScreenHandle();

  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(
    getDefaultDisplaySettings(),
  );
  const [calibrationValidated, setCalibrationValidated] =
    useState<boolean>(false);
  const [widthInput, setWidthInput] = useState(defaultWidthDimensionValue);
  const [heightInput, setHeightInput] = useState(defaultHeightDimensionValue);
  const width = Number(widthInput) > 0 ? Number(widthInput) : 1;
  const height = Number(heightInput) > 0 ? Number(heightInput) : 1;
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [fileLoadStatus, setFileLoadStatus] = useState<LoadStatusEnum>(
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
  const [buttonColor, setButtonColor] = useState<ButtonColor>(
    ButtonColor.PURPLE,
  );
  const [mailOpen, setMailOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<null | string>(null);

  const [points, dispatch] = useReducer(pointsReducer, []);
  const [stitchSettings, dispatchStitchSettings] = useReducer(
    stitchSettingsReducer,
    defaultStitchSettings,
  );
  const { layers, dispatchLayersAction } = useLayers(file?.name ?? "default");
  const setLayers = useCallback(
    (l: Layers) => dispatchLayersAction({ type: "set-layers", layers: l }),
    [dispatchLayersAction],
  );
  const [patternScale, dispatchPatternScaleAction] = useReducer(
    PatternScaleReducer,
    "1.00",
  );
  const patternScaleFactor =
    Number(patternScale) === 0 ? 1 : Number(patternScale);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const t = useTranslations("Header");
  const g = useTranslations("General");

  const IDLE_TIMEOUT = 8000;

  const svgStyle = {
    filter: filter(magnifying, lineThickness, displaySettings.theme),
  };

  // Set erosions when not magnifying so the user can see text/lines more clearly when magnifying
  function filter(magnifying: boolean, lineThickness: number, theme: Theme) {
    const t = themeFilter(theme);
    const thicken = erosionFilter(magnifying ? 0 : lineThickness);
    if (thicken == "none") {
      return t;
    }
    if (t == "none") {
      return thicken;
    }
    return `${thicken} ${t}`;
  }

  // Manage the timeout used for hiding menus when the user hasn't interacted with the site for the specified timeout
  function resetIdle() {
    setIsIdle(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
    }, IDLE_TIMEOUT);
  }

  // Create a default calibration grid that fits within the viewport with a bit of a border
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

  // Merge new settings (i.e. width x height, theme, overlays) with settings from localStorage
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

  // CALLBACKS

  // Get the calibration and perspective transform matrices from the user's calibration grid points, width x height, and unit of measure.
  const calibrationCallback = useCallback(() => {
    if (points.length === maxPoints) {
      try {
        const m = getPerspectiveTransformFromPoints(
          points,
          width,
          height,
          getPtDensity(unitOfMeasure),
          false,
        );

        setCalibrationTransform(m);
        setPerspective(inverse(m));
      } catch (e) {
        setCalibrationTransform(Matrix.identity(3, 3));
        setPerspective(Matrix.identity(3, 3));
        dispatch({ type: "set", points: getDefaultPoints() }); // Fixes #363: on Chrome sometimes the points are set as zeros in localStorage
      }
    }
  }, [points, width, height, unitOfMeasure]);

  // Prevent the user from zooming
  const noZoomRefCallback = useCallback((element: HTMLElement | null) => {
    if (element === null) {
      return;
    }
    element.addEventListener("wheel", (e) => e.ctrlKey && e.preventDefault(), {
      passive: false,
    });
  }, []);

  // If possible, stop the device from going to sleep
  const requestWakeLock = useCallback(async () => {
    if ("wakeLock" in navigator) {
      try {
        await navigator.wakeLock.request("screen");
      } catch (e) {}
    }
  }, []);

  // HANDLERS

  // Save valid calibration grid height in localStorage
  function handleHeightChange(e: ChangeEvent<HTMLInputElement>) {
    const h = removeNonDigits(e.target.value, heightInput);
    setHeightInput(h);
    updateLocalSettings({ height: h });
  }

  // Save valid calibration grid width in localStorage
  function handleWidthChange(e: ChangeEvent<HTMLInputElement>) {
    const w = removeNonDigits(e.target.value, widthInput);
    setWidthInput(w);
    updateLocalSettings({ width: w });
  }

  // Set new file; reset file based state; and if available, load file based state from localStorage
  function handleFileChange(e: ChangeEvent<HTMLInputElement>): void {
    const { files } = e.target;

    if (files && files[0] && isValidFile(files[0])) {
      setFile(files[0]);
      setFileLoadStatus(LoadStatusEnum.LOADING);
      setRestoreTransforms(null);
      setZoomedOut(false);
      setMagnifying(false);
      setMeasuring(false);
      setPageCount(0);
      setLayers({});
      dispatchPatternScaleAction({ type: "set", scale: "1.00" });
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
        if (!stitchSettings.lineCount) {
          // Old naming
          stitchSettings.lineCount = stitchSettings.columnCount;
        }
        if (!stitchSettings.lineDirection) {
          // For people who saved stitch settings before Line Direction was an option
          stitchSettings.lineDirection = LineDirection.Column;
        }
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

      calibrationCallback();
    }

    // If the user calibrated in full screen, try to go back into full screen after opening the file: some browsers pop users out of full screen when selecting a file
    const expectedContext = localStorage.getItem("calibrationContext");
    if (expectedContext !== null) {
      const expected = JSON.parse(expectedContext) as CalibrationContext;
      try {
        if (expected.fullScreen) {
          fullScreenHandle.enter();
        }
      } catch (e) {}
    }
  }

  function handlePointerDown(e: React.PointerEvent) {
    resetIdle();

    // Subtle reminder to enter full screen when calibrating
    if (fullScreenTooltipVisible) {
      setFullScreenTooltipVisible(false);
    }

    // Check if the calibration context (e.g. viewport location, device pixel ratio, etc.) has changed since the last calibration
    // Used to prompt the user if there has been a context change so they can verify that the calibration is still accurate
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

    // Show menus when the user interacts with the app
    resetIdle();
    setMenusHidden(false);
  }

  // EFFECTS

  // Allow the user to open the file from their file browser, e.g., "Open With"
  useEffect(() => {
    requestWakeLock();
    if ("launchQueue" in window) {
      window.launchQueue.setConsumer(
        async (launchParams: { files: [FileSystemHandle] }) => {
          for (const handle of launchParams.files) {
            if (handle.kind == "file") {
              const file = await (handle as FileSystemFileHandle).getFile();
              setFile(file);
              return;
            }
          }
        },
      );
    }
  });

  // Remove buy me a coffee button when calibrating and projecting
  useEffect(() => {
    const element = document.getElementById("bmc-wbtn");
    if (element) {
      element.style.display = "none";
    }
  }, []);

  // Set calibration and perspective transforms
  useEffect(() => {
    calibrationCallback();
  }, [points, width, height, unitOfMeasure, calibrationCallback]);

  // Load data from localStorage
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
      if (localSettings.height && Number(localSettings.height) > 0) {
        setHeightInput(localSettings.height);
      }
      if (localSettings.width && Number(localSettings.width) > 0) {
        setWidthInput(localSettings.width);
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

  // Set button color style based on URL: blue for the beta site and gray for old site
  useEffect(() => {
    const s = window.location.host.split(".")[0];
    if (s.localeCompare("beta") === 0) {
      setButtonColor(ButtonColor.BLUE);
    }
    if (s.localeCompare("old") === 0) {
      setButtonColor(ButtonColor.GRAY);
    }
  }, []);

  // Show a helpful error message when there is a client side error
  useEffect(() => {
    window.addEventListener("error", (e) => {
      setErrorMessage(
        `${navigator.userAgent}|${e.filename}:${e.lineno}:${e.colno}:${e.message}`,
      );
      e.preventDefault();
    });
  }, []);

  // Show a calibration warning when the calibration context is different than what was calibrated in
  useEffect(() => {
    const projectingWithInvalidContext =
      !isCalibrating && !calibrationValidated;
    setShowCalibrationAlert(projectingWithInvalidContext);
  }, [isCalibrating, calibrationValidated]);

  // Hide menus after a timeout as long ad they aren't calibrating, zoomed out, haven't loaded a file yet or are in the process of loading a file
  useEffect(() => {
    setMenusHidden(
      isIdle &&
        !isCalibrating &&
        !zoomedOut &&
        file !== null &&
        fileLoadStatus !== LoadStatusEnum.LOADING,
    );
  }, [isIdle, isCalibrating, zoomedOut, file, fileLoadStatus]);

  // Continually check the calibration context because the user could change the viewport size at any time and ruin their calibration
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
  const dataUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
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
            <div className="flex flex-col items-center gap-4 absolute left-1/4 top-1/2 -translate-y-1/2 w-1/2 bg-white dark:bg-black dark:text-white z-[150] p-4 rounded border-2 border-black dark:border-white">
              <WarningIcon ariaLabel="warning" />
              <p>{t("calibrationAlert")}</p>
              <Button
                className="flex items-center justify-center"
                onClick={() => toggleFullScreen(fullScreenHandle)}
              >
                <span className="mr-1 -mt-1.5 w-4 h-4">
                  {fullScreenHandle.active ? (
                    <FullScreenIcon ariaLabel={t("fullscreen")} />
                  ) : (
                    <FullScreenExitIcon ariaLabel={t("fullscreenExit")} />
                  )}
                </span>
                {fullScreenHandle.active
                  ? t("fullscreenExit")
                  : t("fullscreen")}
              </Button>
              <p>{t("calibrationAlertContinue")}</p>
            </div>
          ) : null}
          <Modal open={errorMessage !== null}>
            <ModalTitle>{g("error")}</ModalTitle>
            <ModalContent>
              <ModalText>{errorMessage}</ModalText>
              <ModalActions>
                <Button onClick={() => setErrorMessage(null)}>
                  {g("close")}
                </Button>
              </ModalActions>
            </ModalContent>
          </Modal>
          {isCalibrating && (
            <CalibrationCanvas
              className={`absolute ${visible(isCalibrating)}`}
              points={points}
              dispatch={dispatch}
              width={width}
              height={height}
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
                width,
                height,
                unitOfMeasure,
              )}
              zoomedOut={zoomedOut}
              magnifying={magnifying}
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
                  width,
                  height,
                  unitOfMeasure,
                )}
                menuStates={menuStates}
                file={file}
              >
                {file === null || file.type === "application/pdf" ? (
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
                    setFileLoadStatus={setFileLoadStatus}
                    magnifying={magnifying}
                    gridCenter={getCalibrationCenterPoint(
                      width,
                      height,
                      unitOfMeasure,
                    )}
                    patternScale={patternScaleFactor}
                    setMenuStates={setMenuStates}
                  />
                ) : (
                  <SvgViewer
                    dataUrl={dataUrl ?? ""}
                    setFileLoadStatus={setFileLoadStatus}
                    setLayoutWidth={setLayoutWidth}
                    setLayoutHeight={setLayoutHeight}
                    setPageCount={setPageCount}
                    layers={layers}
                    setLayers={setLayers}
                    svgStyle={svgStyle}
                    patternScale={patternScaleFactor}
                    setMenuStates={setMenuStates}
                    patternScaleFactor={patternScaleFactor}
                  />
                )}
              </Draggable>
              <OverlayCanvas
                className={`absolute top-0 pointer-events-none`}
                points={points}
                width={width}
                height={height}
                unitOfMeasure={unitOfMeasure}
                displaySettings={displaySettings}
                calibrationTransform={calibrationTransform}
                zoomedOut={zoomedOut}
                magnifying={magnifying}
                restoreTransforms={restoreTransforms}
                patternScale={String(patternScaleFactor)}
              />
            </MeasureCanvas>

            <menu
              className={`absolute w-screen ${visible(!menusHidden)} ${menuStates.nav ? "top-0" : "-top-16"} pointer-events-none`}
            >
              <menu className="pointer-events-auto">
                <Header
                  isCalibrating={isCalibrating}
                  setIsCalibrating={setIsCalibrating}
                  widthInput={widthInput}
                  heightInput={heightInput}
                  width={width}
                  height={height}
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
                  fileLoadStatus={fileLoadStatus}
                  lineThicknessStatus={lineThicknessStatus}
                  buttonColor={buttonColor}
                  mailOpen={mailOpen}
                  setMailOpen={setMailOpen}
                  invalidCalibration={checkIsConcave(points)}
                  file={file}
                />
                {isCalibrating && menuStates.nav && (
                  <TroubleshootingButton
                    isDarkTheme={isDarkTheme(displaySettings.theme)}
                  />
                )}
                <MailModal open={mailOpen} setOpen={setMailOpen} />
              </menu>

              {!isCalibrating && file !== null && (
                <SideMenu
                  menuStates={menuStates}
                  setMenuStates={setMenuStates}
                  pageCount={pageCount}
                  layers={layers}
                  dispatchLayersAction={dispatchLayersAction}
                  file={file}
                  stitchSettings={stitchSettings}
                  dispatchStitchSettings={dispatchStitchSettings}
                  patternScale={patternScale}
                  dispatchPatternScaleAction={dispatchPatternScaleAction}
                />
              )}
            </menu>
            <IconButton
              className={`${visible(!menusHidden)} !p-1 m-0 border-2 border-black dark:border-white absolute ${menuStates.nav ? "-top-16" : "top-2"} left-1/4 focus:ring-0`}
              onClick={() => setMenuStates({ ...menuStates, nav: true })}
            >
              <ExpandMoreIcon ariaLabel={t("menuShow")} />
            </IconButton>
            {!isCalibrating && fileLoadStatus === LoadStatusEnum.LOADING ? (
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
