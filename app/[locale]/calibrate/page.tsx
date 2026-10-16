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
import { getPtDensity, Unit } from "@/_lib/unit";
import { visible } from "@/_components/theme/css-functions";
import { useTranslations } from "next-intl";
import MeasureCanvas from "@/_components/canvases/measure-canvas";
import { getDefaultMenuStates, MenuStates } from "@/_lib/menu-states";
import MovementPad from "@/_components/movement-pad";
import pointsReducer from "@/_reducers/pointsReducer";
import Filters from "@/_components/filters";
import CalibrationContext, {
  CalibrationMismatch,
  getCalibrationContext,
  getCalibrationContextUpdatedWithEvent,
  getCalibrationMismatch,
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
  VerticalAlignment,
  StitchSettings,
} from "@/_lib/interfaces/stitch-settings";
import { IconButton } from "@/_components/buttons/icon-button";
import { Layers } from "@/_lib/layers";
import useLayers from "@/_hooks/use-layers";
import ExpandMoreIcon from "@/_icons/expand-more-icon";
import { LoadStatusEnum } from "@/_lib/load-status-enum";
import LoadingSpinner from "@/_icons/loading-spinner";
import TroubleshootingButton from "@/_components/troubleshooting-button";
import { ButtonColor } from "@/_components/theme/colors";
import { ButtonStyle } from "@/_components/theme/styles";
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
import LensCorrectionFilter, {
  lensCorrectionFilter,
} from "@/_components/lens-correction-filter";
import {
  LensCorrection,
  clampLensCorrectionStrength,
  keepPointsInPlace,
  getDefaultLensCorrection,
  lensSourcePoint,
  parseLensCorrection,
} from "@/_lib/lens-correction";
import { Point } from "@/_lib/point";
import CalibrationGuide from "@/_components/calibration-guide";
import {
  GuideStep,
  Placement,
  initialGuideStep,
  placementFromPoints,
  pointsFromPlacement,
} from "@/_lib/guided-calibration";
import ProjectsModal from "@/_components/projects-modal";
import ProjectsHome from "@/_components/projects-home";
import {
  OpenDestination,
  openDestination,
  parseCalibrationContext,
} from "@/_lib/start-flow";
import { Project } from "@/_lib/projects";
import {
  deleteProject,
  isProjectStoreAvailable,
  listProjects,
  openProject,
  renameProject,
  saveOpenedFile,
} from "@/_lib/project-store";

const defaultStitchSettings = {
  lineCount: 1,
  edgeInsets: { horizontal: 0, vertical: 0 },
  pageRange: "1-",
  lineDirection: LineDirection.Column,
  verticalAlignment: VerticalAlignment.Top,
} as StitchSettings;

interface CalibrationSnapshot {
  points: Point[];
  width: string;
  height: string;
  unitOfMeasure: Unit;
  lensCorrection: LensCorrection;
  context: string | null;
}

export default function Page() {
  // Default dimensions should be available on most cutting mats and large enough to get an accurate calibration
  const defaultWidthDimensionValue = "24";
  const defaultHeightDimensionValue = "16";
  const maxDimensionValue = 1000; // Prevents crashing from excessive grid lines #410

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
  // Calibration starts from the home screen or the Calibrate button, and ends with Save or Cancel
  const [isCalibrating, setIsCalibrating] = useState(false);
  const calibrationSnapshot = useRef<CalibrationSnapshot | null>(null);
  // Where Save or Cancel goes back to: the home screen or the pattern being projected
  const calibrationReturnsHome = useRef(false);
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
  const [unitOfMeasure, setUnitOfMeasure] = useState<Unit>(Unit.IN);
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
  const [calibrationMismatch, setCalibrationMismatch] =
    useState<CalibrationMismatch | null>(null);
  // A dismissed warning shrinks to a reminder banner until the mismatch changes or is fixed
  const [dismissedMismatch, setDismissedMismatch] =
    useState<CalibrationMismatch | null>(null);
  const mismatchDismissed =
    calibrationMismatch !== null &&
    JSON.stringify(dismissedMismatch) === JSON.stringify(calibrationMismatch);
  const [fullScreenTooltipVisible, setFullScreenTooltipVisible] =
    useState(true);
  const [buttonColor, setButtonColor] = useState<ButtonColor>(
    ButtonColor.PURPLE,
  );
  const [errorMessage, setErrorMessage] = useState<null | string>(null);
  const [lensCorrection, setLensCorrection] = useState<LensCorrection>(
    getDefaultLensCorrection(),
  );
  const [lensCorrectionInput, setLensCorrectionInput] = useState("0");
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [guideStep, setGuideStep] = useState<GuideStep | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsOpen, setProjectsOpen] = useState(false);
  // The app starts on the projects home screen, outside full screen
  const [showHome, setShowHome] = useState(true);
  const [homeNotice, setHomeNotice] = useState<string | null>(null);

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
    const h = removeNonDigits(e.target.value, heightInput, maxDimensionValue);
    setHeightInput(h);
    updateLocalSettings({ height: h });
  }

  // Save valid calibration grid width in localStorage
  function handleWidthChange(e: ChangeEvent<HTMLInputElement>) {
    const w = removeNonDigits(e.target.value, widthInput, maxDimensionValue);
    setWidthInput(w);
    updateLocalSettings({ width: w });
  }

  // Save the projector lens correction in localStorage and move the calibration points so the corners stay where
  // they are on screen: the lens correction then only bends the lines between them
  function applyLensCorrection(newLensCorrection: LensCorrection) {
    if (points.length === maxPoints) {
      dispatch({
        type: "set",
        points: keepPointsInPlace(
          points,
          viewportSize.width,
          viewportSize.height,
          lensCorrection,
          newLensCorrection,
        ),
      });
    }
    setLensCorrection(newLensCorrection);
    updateLocalSettings({ lensCorrection: newLensCorrection });
  }

  // Keep the raw input so the user can type "-" or "1."
  function handleLensCorrectionChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target.value;
    setLensCorrectionInput(input);
    const strength = Number(input);
    if (input.trim() !== "" && Number.isFinite(strength)) {
      applyLensCorrection({ strength: clampLensCorrectionStrength(strength) });
    }
  }

  // Set the lens correction from the guide's buttons
  function setLensCorrectionStrength(strength: number) {
    const newLensCorrection = {
      strength: clampLensCorrectionStrength(Math.round(strength * 100) / 100),
    };
    setLensCorrectionInput(String(newLensCorrection.strength));
    applyLensCorrection(newLensCorrection);
  }

  // Move, resize or rotate the whole calibration grid, keeping it rectangular
  function adjustPlacement(change: (placement: Placement) => Placement) {
    if (points.length !== maxPoints) {
      return;
    }
    const placement = placementFromPoints(points, width, height);
    dispatch({
      type: "set",
      points: pointsFromPlacement(change(placement), width, height),
    });
    localStorage.setItem(
      "calibrationContext",
      JSON.stringify(getCalibrationContext(fullScreenHandle.active)),
    );
  }

  function handleGuideStepChange(step: GuideStep | null) {
    if (step === GuideStep.Align) {
      // Square up the grid so the target can be lined up by moving, resizing and rotating it
      adjustPlacement((placement) => placement);
      setCorners(new Set([0, 1, 2, 3]));
    } else if (step === GuideStep.Corners) {
      setCorners(new Set([0]));
    }
    setGuideStep(step);
  }

  // Convert a pointer position on the lens corrected screen to the position in the uncorrected content
  const toContentPoint = useCallback(
    (p: Point) =>
      lensSourcePoint(
        p,
        viewportSize.width,
        viewportSize.height,
        lensCorrection,
      ),
    [viewportSize, lensCorrection],
  );

  // Set new file; reset file based state; and if available, load file based state from localStorage
  function openFile(newFile: File): void {
    if (isValidFile(newFile)) {
      setFile(newFile);
      setFileLoadStatus(LoadStatusEnum.LOADING);
      setRestoreTransforms(null);
      setZoomedOut(false);
      setMagnifying(false);
      setMeasuring(false);
      setPageCount(0);
      setLayers({});
      dispatchPatternScaleAction({
        type: "set",
        scale: localStorage.getItem(`patternScale:${newFile.name}`) ?? "1.00",
      });
      const lineThicknessString = localStorage.getItem(
        `lineThickness:${newFile.name}`,
      );
      if (lineThicknessString !== null) {
        setLineThickness(Number(lineThicknessString));
      } else {
        setLineThickness(0);
      }

      const key = `stitchSettings:${newFile.name ?? "default"}`;
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
        if (!stitchSettings.verticalAlignment) {
          // For people who saved stitch settings before Vertical Alignment was an option
          stitchSettings.verticalAlignment = VerticalAlignment.Top;
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

      // Keep the file in the browser so it can be reopened from the projects list
      if (isProjectStoreAvailable()) {
        saveOpenedFile(newFile)
          .then(refreshProjects)
          .catch(() => {});
      }
    }
  }

  const refreshProjects = useCallback(() => {
    if (!isProjectStoreAvailable()) return;
    listProjects()
      .then(setProjects)
      .catch(() => {});
  }, []);

  function handleOpenProject(project: Project) {
    openProject(project.id)
      .then(openFile)
      .catch(() => setErrorMessage(t("projectOpenError")));
  }

  function isFullScreenAvailable() {
    return typeof document !== "undefined" && document.fullscreenEnabled;
  }

  // Must be called straight from a click: browsers only allow full screen in response to the user
  function enterFullScreen() {
    if (isFullScreenAvailable() && !fullScreenHandle.active) {
      fullScreenHandle.enter().catch(() => {});
    }
  }

  // Opening a project from the home screen goes full screen, then calibrates first if there's no full screen calibration
  function handleOpenProjectFromHome(project: Project) {
    enterFullScreen();
    const destination = openDestination(
      localStorage.getItem("points"),
      parseCalibrationContext(localStorage.getItem("calibrationContext")),
      isFullScreenAvailable(),
    );
    if (destination === OpenDestination.Calibrate) {
      startCalibration();
    } else {
      setIsCalibrating(false);
    }
    setHomeNotice(null);
    setShowHome(false);
    handleOpenProject(project);
  }

  function handleCalibrateFromHome() {
    enterFullScreen();
    startCalibration(true);
    setHomeNotice(null);
    setShowHome(false);
  }

  // Adding a pattern on the home screen only saves it: opening it is a separate click, which is what allows full screen
  function handleAddFile(newFile: File) {
    if (!isValidFile(newFile)) {
      setHomeNotice(t("invalidFile", { name: newFile.name }));
      return;
    }
    if (!isProjectStoreAvailable()) {
      setErrorMessage(t("projectSaveError"));
      return;
    }
    saveOpenedFile(newFile)
      .then((project) => {
        refreshProjects();
        setHomeNotice(t("patternAdded", { name: project.name }));
      })
      .catch(() => setErrorMessage(t("projectSaveError")));
  }

  // The home screen is a normal window, so leave full screen to use the file browser there
  function goHome() {
    setProjectsOpen(false);
    if (fullScreenHandle.active) {
      fullScreenHandle.exit().catch(() => {});
    }
    setShowHome(true);
  }

  // Remember the calibration as it was, so Cancel can put it back
  function startCalibration(fromHome = false) {
    calibrationReturnsHome.current = fromHome;
    calibrationSnapshot.current = {
      points: [...points],
      width: widthInput,
      height: heightInput,
      unitOfMeasure,
      lensCorrection,
      context: localStorage.getItem("calibrationContext"),
    };
    setIsCalibrating(true);
  }

  // Recalibrate in full screen, which keeps measurements right while cutting, unless the user chose to stay in a window
  function handleRecalibrate() {
    if (calibrationMismatch?.kind !== "calibratedInFullScreen") {
      enterFullScreen();
    }
    startCalibration();
  }

  function finishCalibration() {
    calibrationSnapshot.current = null;
    setGuideStep(null);
    setIsCalibrating(false);
    if (calibrationReturnsHome.current) {
      goHome();
    } else if (file === null) {
      if (projects.length > 0) {
        setProjectsOpen(true);
      } else {
        goHome();
      }
    }
  }

  // Saving records the screen the calibration was made on, full screen or window, so projecting can check it matches
  function handleSaveCalibration(e: React.MouseEvent<HTMLButtonElement>) {
    localStorage.setItem(
      "calibrationContext",
      JSON.stringify(
        getCalibrationContextUpdatedWithEvent(e, fullScreenHandle.active),
      ),
    );
    setCalibrationValidated(true);
    finishCalibration();
  }

  function handleCancelCalibration() {
    const snapshot = calibrationSnapshot.current;
    if (snapshot) {
      dispatch({ type: "set", points: snapshot.points });
      setWidthInput(snapshot.width);
      setHeightInput(snapshot.height);
      setUnitOfMeasure(snapshot.unitOfMeasure);
      setLensCorrection(snapshot.lensCorrection);
      setLensCorrectionInput(String(snapshot.lensCorrection.strength));
      updateLocalSettings({
        width: snapshot.width,
        height: snapshot.height,
        unitOfMeasure: snapshot.unitOfMeasure,
        lensCorrection: snapshot.lensCorrection,
      });
      if (snapshot.context === null) {
        localStorage.removeItem("calibrationContext");
      } else {
        localStorage.setItem("calibrationContext", snapshot.context);
      }
    }
    finishCalibration();
  }

  // Patterns dropped on the projection open straight away, without leaving full screen
  function handleDrop(e: React.DragEvent) {
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && !showHome) {
      e.preventDefault();
      openFile(droppedFile);
    }
  }

  function handleRenameProject(project: Project, name: string) {
    renameProject(project.id, name)
      .then(refreshProjects)
      .catch(() => {});
  }

  function handleDeleteProject(project: Project) {
    deleteProject(project.id)
      .then(refreshProjects)
      .catch(() => {});
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
              // Add it to the home screen: opening it from there goes full screen
              handleAddFile(file);
              return;
            }
          }
        },
      );
    }
  });

  // Load the saved projects list
  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  // Remember the pattern scale for each pattern
  useEffect(() => {
    if (file) {
      localStorage.setItem(`patternScale:${file.name}`, patternScale);
    }
    // Only save when the scale changes: opening a file sets the file and its saved scale together
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patternScale]);

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
    // Only ever open the guide here: React may run this effect twice in development, and the first run saves points
    const startStep = initialGuideStep(localPoints !== null);
    if (startStep !== null) {
      setGuideStep(startStep);
    }
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

      if (localSettings.lensCorrection !== undefined) {
        const savedLensCorrection = parseLensCorrection(
          localSettings.lensCorrection,
        );
        setLensCorrection(savedLensCorrection);
        setLensCorrectionInput(String(savedLensCorrection.strength));
      }

      const defaults = getDefaultDisplaySettings();
      setDisplaySettings({
        overlay: localSettings.overlay ?? defaults.overlay,
        theme: localSettings.theme ?? defaults.theme,
      });
    }
  }, []);

  // Track the viewport size because the lens correction is centred on the screen
  useEffect(() => {
    function updateViewportSize() {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    }
    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);
    return () => window.removeEventListener("resize", updateViewportSize);
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

  // Show a calibration warning when the calibration context is different than what was calibrated in. Wait a moment
  // first: going in and out of full screen takes a second, and the screen doesn't match while it animates.
  useEffect(() => {
    if (isCalibrating || showHome || calibrationValidated) {
      setShowCalibrationAlert(false);
      return;
    }
    const timeout = setTimeout(() => setShowCalibrationAlert(true), 1500);
    return () => clearTimeout(timeout);
  }, [isCalibrating, showHome, calibrationValidated]);

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
      const mismatch = getCalibrationMismatch(
        parseCalibrationContext(localStorage.getItem("calibrationContext")),
        getCalibrationContext(fullScreenHandle.active),
      );
      setCalibrationMismatch((previous) =>
        JSON.stringify(previous) === JSON.stringify(mismatch)
          ? previous
          : mismatch,
      );
      if ((mismatch !== null) === calibrationValidated) {
        setCalibrationValidated(mismatch === null);
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
      onKeyDown={resetIdle}
      onDragOver={(e) => {
        if (!showHome) e.preventDefault();
      }}
      onDrop={handleDrop}
      ref={noZoomRefCallback}
      className={`${menusHidden && "cursor-none"} ${isDarkTheme(displaySettings.theme) && "dark bg-black"} w-screen h-screen absolute overflow-hidden touch-none`}
    >
      <div className="bg-white dark:bg-black dark:text-white w-screen h-screen ">
        <FullScreen
          handle={fullScreenHandle}
          className="bg-white dark:bg-black transition-all duration-500 w-screen h-screen"
        >
          {showCalibrationAlert &&
          calibrationMismatch !== null &&
          mismatchDismissed ? (
            <div
              role="status"
              data-testid="calibration-reminder"
              className="absolute left-1/2 bottom-4 -translate-x-1/2 z-[100] flex items-center gap-3 rounded border-2 border-black dark:border-white bg-white dark:bg-black dark:text-white px-3 py-1 text-sm shadow"
            >
              <WarningIcon ariaLabel="warning" />
              <p>{t("calibrationReminder")}</p>
              <Button onClick={handleRecalibrate}>{t("recalibrate")}</Button>
            </div>
          ) : null}
          {showCalibrationAlert &&
          calibrationMismatch !== null &&
          !mismatchDismissed ? (
            <div
              role="alert"
              data-testid="calibration-alert"
              className="flex flex-col items-center gap-4 absolute left-1/4 top-1/2 -translate-y-1/2 w-1/2 bg-white dark:bg-black dark:text-white z-[150] p-4 rounded border-2 border-black dark:border-white"
            >
              <WarningIcon ariaLabel="warning" />
              <p>
                {calibrationMismatch.kind === "sizeChanged"
                  ? t("calibrationMismatch.sizeChanged", {
                      was: `${calibrationMismatch.was.width} × ${calibrationMismatch.was.height}`,
                      now: `${calibrationMismatch.now.width} × ${calibrationMismatch.now.height}`,
                    })
                  : t(`calibrationMismatch.${calibrationMismatch.kind}`)}
              </p>
              <div className="flex gap-2">
                {calibrationMismatch.kind === "calibratedInFullScreen" && (
                  <Button
                    style={ButtonStyle.FILLED}
                    onClick={() => fullScreenHandle.enter().catch(() => {})}
                  >
                    {t("fullscreen")}
                  </Button>
                )}
                <Button
                  style={
                    calibrationMismatch.kind === "calibratedInFullScreen"
                      ? ButtonStyle.OUTLINE
                      : ButtonStyle.FILLED
                  }
                  onClick={handleRecalibrate}
                >
                  {calibrationMismatch.kind === "calibratedInFullScreen"
                    ? t("recalibrateInWindow")
                    : t("recalibrate")}
                </Button>
                <Button
                  onClick={() => setDismissedMismatch(calibrationMismatch)}
                >
                  {t("calibrationAlertDismiss")}
                </Button>
              </div>
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
            <div
              className="absolute top-0 left-0 w-screen h-screen"
              style={{ filter: lensCorrectionFilter(lensCorrection) }}
            >
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
                toContentPoint={toContentPoint}
                guideStep={guideStep}
                adjustPlacement={adjustPlacement}
              />
            </div>
          )}
          {isCalibrating && (
            <CalibrationGuide
              step={guideStep}
              setStep={handleGuideStepChange}
              isDarkTheme={isDarkTheme(displaySettings.theme)}
              adjustPlacement={adjustPlacement}
              lensCorrectionStrength={lensCorrection.strength}
              setLensCorrectionStrength={setLensCorrectionStrength}
            />
          )}
          {isCalibrating &&
            !showHome &&
            !fullScreenHandle.active &&
            isFullScreenAvailable() && (
              <div
                role="alert"
                className="absolute left-1/2 top-20 -translate-x-1/2 z-[100] flex items-center gap-3 rounded border-2 border-black bg-white px-4 py-2 text-black shadow"
              >
                <p className="text-sm">{t("calibrateInFullScreen")}</p>
                <Button
                  onClick={() => fullScreenHandle.enter().catch(() => {})}
                >
                  {t("fullscreen")}
                </Button>
              </div>
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
            {/* Ignore the pointer while calibrating so this layer does not cover the calibration canvas */}
            <div
              className={`absolute top-0 left-0 w-screen h-screen ${isCalibrating ? "pointer-events-none" : ""}`}
              style={{ filter: lensCorrectionFilter(lensCorrection) }}
            >
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
                isDarkTheme={isDarkTheme(displaySettings.theme)}
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
            </div>

            <menu
              className={`absolute w-screen ${visible(!menusHidden)} ${menuStates.nav ? "top-0" : "-top-16"} pointer-events-none`}
            >
              <menu className="pointer-events-auto">
                <Header
                  isCalibrating={isCalibrating}
                  onCalibrate={() => startCalibration()}
                  onSaveCalibration={handleSaveCalibration}
                  onCancelCalibration={handleCancelCalibration}
                  widthInput={widthInput}
                  heightInput={heightInput}
                  width={width}
                  height={height}
                  handleHeightChange={handleHeightChange}
                  handleWidthChange={handleWidthChange}
                  lensCorrectionInput={lensCorrectionInput}
                  handleLensCorrectionChange={handleLensCorrectionChange}
                  handleResetCalibration={() => {
                    localStorage.setItem(
                      "calibrationContext",
                      JSON.stringify(
                        getCalibrationContext(fullScreenHandle.active),
                      ),
                    );
                    dispatch({ type: "set", points: getDefaultPoints() });
                  }}
                  showProjects={() => setProjectsOpen(true)}
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
                  fullScreenTooltipVisible={fullScreenTooltipVisible}
                  magnifying={magnifying}
                  setMagnifying={setMagnifying}
                  zoomedOut={zoomedOut}
                  setZoomedOut={setZoomedOut}
                  fileLoadStatus={fileLoadStatus}
                  lineThicknessStatus={lineThicknessStatus}
                  buttonColor={buttonColor}
                  invalidCalibration={checkIsConcave(points)}
                />
                {isCalibrating && menuStates.nav && (
                  <TroubleshootingButton
                    isDarkTheme={isDarkTheme(displaySettings.theme)}
                  />
                )}
                <ProjectsModal
                  open={projectsOpen}
                  setOpen={setProjectsOpen}
                  projects={projects}
                  currentFileName={file?.name ?? null}
                  onOpenProject={handleOpenProject}
                  onGoHome={goHome}
                  onRenameProject={handleRenameProject}
                  onDeleteProject={handleDeleteProject}
                />
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
            {/* Sits exactly where the header's hide button was, at the far left of a strip as tall as the header inside its bottom border */}
            <div
              className={`${visible(!menusHidden)} pointer-events-none absolute left-2 lg:left-6 h-[63px] flex items-center ${menuStates.nav ? "-top-16" : "top-0"}`}
            >
              <IconButton
                className="pointer-events-auto !p-1 m-0 border-2 border-black dark:border-white focus:ring-0"
                onClick={() => setMenuStates({ ...menuStates, nav: true })}
              >
                <ExpandMoreIcon ariaLabel={t("menuShow")} />
              </IconButton>
            </div>
            {!isCalibrating && fileLoadStatus === LoadStatusEnum.LOADING ? (
              <LoadingSpinner
                height={100}
                width={100}
                className="absolute left-1/2 top-1/2"
              />
            ) : null}
          </Transformable>
        </FullScreen>
        {showHome && (
          <ProjectsHome
            projects={projects}
            currentFileName={file?.name ?? null}
            notice={homeNotice}
            buttonColor={buttonColor}
            onOpenProject={handleOpenProjectFromHome}
            onAddFile={handleAddFile}
            onRenameProject={handleRenameProject}
            onDeleteProject={handleDeleteProject}
            onCalibrate={handleCalibrateFromHome}
          />
        )}
      </div>
      <Filters />
      <LensCorrectionFilter
        lensCorrection={lensCorrection}
        width={viewportSize.width}
        height={viewportSize.height}
      />
    </main>
  );
}
