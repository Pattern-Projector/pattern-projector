import { useTranslations } from "next-intl";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useMemo,
  useState,
} from "react";
import { FullScreenHandle } from "react-full-screen";

import InlineInput from "@/_components/inline-input";
import InlineSelect from "@/_components/inline-select";
import RestartIcon from "@/_icons/restart-icon";
import SettingsIcon from "@/_icons/settings-icon";
import KeyboardArrowLeftIcon from "@/_icons/keyboard-arrow-left";
import FlipHorizontalIcon from "@/_icons/flip-horizontal-icon";
import FlipVerticalIcon from "@/_icons/flip-vertical-icon";
import FlipCenterOnIcon from "@/_icons/flip-center-on-icon";
import GridOffIcon from "@/_icons/grid-off-icon";
import GridOnIcon from "@/_icons/grid-on-icon";
import OverlayBorderIcon from "@/_icons/overlay-border-icon";
import OverlayPaperIcon from "@/_icons/overlay-paper-icon";
import InvertColorIcon from "@/_icons/invert-color-icon";
import InvertColorOffIcon from "@/_icons/invert-color-off-icon";
import Rotate90DegreesCWIcon from "@/_icons/rotate-90-degrees-cw-icon";
import {
  DisplaySettings,
  isDarkTheme,
  strokeColor,
  themes,
} from "@/_lib/display-settings";
import { Unit } from "@/_lib/unit";
import RecenterIcon from "@/_icons/recenter-icon";
import { getCalibrationCenterPoint } from "@/_lib/geometry";
import { IconButton } from "@/_components/buttons/icon-button";
import { DropdownCheckboxIconButton } from "@/_components/buttons/dropdown-checkbox-icon-button";
import Tooltip from "@/_components/tooltip/tooltip";
import ExpandLessIcon from "@/_icons/expand-less-icon";
import LineWeightIcon from "@/_icons/line-weight-icon";
import { useKeyDown } from "@/_hooks/use-key-down";
import { KeyCode } from "@/_lib/key-code";
import { MenuStates } from "@/_lib/menu-states";
import MoveIcon from "@/_icons/move-icon";
import Modal from "./modal/modal";
import { ModalTitle } from "./modal/modal-title";
import { ModalText } from "./modal/modal-text";
import { ModalActions } from "./modal/modal-actions";
import { Button } from "./buttons/button";
import { useTransformerContext } from "@/_hooks/use-transform-context";
import { DropdownIconButton } from "./buttons/dropdown-icon-button";
import MarkAndMeasureIcon from "@/_icons/mark-and-measure-icon";
import FlippedPatternIcon from "@/_icons/flipped-pattern-icon";
import ZoomOutIcon from "@/_icons/zoom-out-icon";
import FullSceenExitIcon from "@/_icons/full-screen-exit-icon";
import FullScreenIcon from "@/_icons/full-screen-icon";
import LoadingSpinner from "@/_icons/loading-spinner";
import { LoadStatusEnum } from "@/_lib/load-status-enum";
import { ButtonStyle } from "./theme/styles";
import { ButtonColor } from "./theme/colors";
import ZoomInIcon from "@/_icons/zoom-in-icon";
import { toggleFullScreen } from "@/_lib/full-screen";

export default function Header({
  isCalibrating,
  onCalibrate,
  onSaveCalibration,
  onCancelCalibration,
  widthInput,
  heightInput,
  width,
  height,
  handleHeightChange,
  handleWidthChange,
  lensCorrectionInput,
  handleLensCorrectionChange,
  handleResetCalibration,
  showProjects,
  fullScreenHandle,
  unitOfMeasure,
  setUnitOfMeasure,
  displaySettings,
  setDisplaySettings,
  layoutWidth,
  layoutHeight,
  lineThickness,
  setLineThickness,
  measuring,
  setMeasuring,
  menuStates,
  setMenuStates,
  showingMovePad,
  setShowingMovePad,
  fullScreenTooltipVisible,
  magnifying,
  setMagnifying,
  zoomedOut,
  setZoomedOut,
  fileLoadStatus,
  lineThicknessStatus,
  buttonColor,
  invalidCalibration,
}: {
  isCalibrating: boolean;
  onCalibrate: () => void;
  onSaveCalibration: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onCancelCalibration: () => void;
  widthInput: string;
  heightInput: string;
  width: number;
  height: number;
  handleHeightChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleWidthChange: (e: ChangeEvent<HTMLInputElement>) => void;
  lensCorrectionInput: string;
  handleLensCorrectionChange: (e: ChangeEvent<HTMLInputElement>) => void;
  showProjects: () => void;
  handleResetCalibration: () => void;
  fullScreenHandle: FullScreenHandle;
  unitOfMeasure: Unit;
  setUnitOfMeasure: (newUnit: Unit) => void;
  displaySettings: DisplaySettings;
  setDisplaySettings: (newDisplaySettings: DisplaySettings) => void;
  layoutWidth: number;
  layoutHeight: number;
  lineThickness: number;
  setLineThickness: (newThickness: number) => void;
  measuring: boolean;
  setMeasuring: Dispatch<SetStateAction<boolean>>;
  menuStates: MenuStates;
  setMenuStates: Dispatch<SetStateAction<MenuStates>>;
  showingMovePad: boolean;
  setShowingMovePad: Dispatch<SetStateAction<boolean>>;
  fullScreenTooltipVisible: boolean;
  magnifying: boolean;
  setMagnifying: Dispatch<SetStateAction<boolean>>;
  zoomedOut: boolean;
  setZoomedOut: Dispatch<SetStateAction<boolean>>;
  fileLoadStatus: LoadStatusEnum;
  lineThicknessStatus: LoadStatusEnum;
  buttonColor: ButtonColor;
  invalidCalibration: boolean;
}) {
  const [calibrationAlert, setCalibrationAlert] = useState("");
  const transformer = useTransformerContext();
  const t = useTranslations("Header");

  const fileInputClassNames = useMemo(() => {
    if (!isCalibrating && fileLoadStatus === LoadStatusEnum.LOADING) {
      return "outline-gray-50 !text-gray-50 !bg-gray-500";
    }
  }, [isCalibrating, fileLoadStatus]);

  function handleSaveCalibrationClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (invalidCalibration) {
      setCalibrationAlert(t("invalidCalibration"));
    } else {
      onSaveCalibration(e);
    }
  }

  const handleRotate90 = () => {
    transformer.rotate(
      getCalibrationCenterPoint(width, height, unitOfMeasure),
      90,
    );
  };

  const handleFlipHorizontal = () => {
    transformer.flipHorizontal(
      getCalibrationCenterPoint(width, height, unitOfMeasure),
    );
  };

  const handleFlipVertical = () => {
    transformer.flipVertical(
      getCalibrationCenterPoint(width, height, unitOfMeasure),
    );
  };

  const handleRecenterReset = () => {
    transformer.reset();
    transformer.recenter(
      getCalibrationCenterPoint(width, height, unitOfMeasure),
      layoutWidth,
      layoutHeight,
    );
  };

  const overlayOptions = {
    disabled: {
      icon: <GridOffIcon ariaLabel={t("overlayOptionDisabled")} />,
      text: t("overlayOptionDisabled"),
    },
    grid: {
      icon: <GridOnIcon ariaLabel={t("overlayOptionGrid")} />,
      text: t("overlayOptionGrid"),
    },
    border: {
      icon: <OverlayBorderIcon ariaLabel={t("overlayOptionBorder")} />,
      text: t("overlayOptionBorder"),
    },
    paper: {
      icon: <OverlayPaperIcon ariaLabel={t("overlayOptionPaper")} />,
      text: t("overlayOptionPaper"),
    },
    flipLines: {
      icon: <FlipCenterOnIcon ariaLabel={t("overlayOptionFliplines")} />,
      text: t("overlayOptionFliplines"),
    },
    flippedPattern: {
      icon: <FlippedPatternIcon ariaLabel={t("overlayOptionFlippedPattern")} />,
      text: t("overlayOptionFlippedPattern"),
    },
  };

  const lineThicknessOptions = [
    {
      text: "0px",
      value: 0,
    },
    {
      text: "1px",
      value: 1,
    },
    {
      text: "2px",
      value: 2,
    },
    {
      text: "3px",
      value: 3,
    },
    {
      text: "4px",
      value: 4,
    },
    {
      text: "5px",
      value: 5,
    },
    {
      text: "6px",
      value: 6,
    },
    {
      text: "7px",
      value: 7,
    },
  ];

  useKeyDown(() => {
    handleFlipHorizontal();
  }, [KeyCode.KeyH]);

  useKeyDown(() => {
    handleFlipVertical();
  }, [KeyCode.KeyV]);

  useKeyDown(() => {
    handleRecenterReset();
  }, [KeyCode.KeyC]);

  useKeyDown(() => {
    handleRotate90();
  }, [KeyCode.KeyR]);

  useKeyDown(() => {
    setMeasuring(!measuring);
  }, [KeyCode.KeyL]);

  useKeyDown(() => {
    setMagnifying(!magnifying);
  }, [KeyCode.KeyM]);

  useKeyDown(() => {
    setZoomedOut(!zoomedOut);
  }, [KeyCode.KeyZ]);

  return (
    <>
      <Modal open={calibrationAlert.length > 0}>
        <ModalTitle>{t("calibrationAlertTitle")}</ModalTitle>
        <ModalText>{calibrationAlert}</ModalText>
        <ModalActions>
          <Button
            onClick={() => {
              handleResetCalibration();
              setCalibrationAlert("");
            }}
          >
            <RestartIcon ariaLabel="" />
            {t("delete")}
          </Button>
          <Button onClick={() => setCalibrationAlert("")}>{t("close")}</Button>
        </ModalActions>
      </Modal>
      <header
        className={`relative z-10 bg-opacity-60 dark:bg-opacity-50 bg-white dark:bg-black left-0 w-full border-b dark:border-gray-700 transition-all duration-500 h-16 flex items-center ${menuStates.nav ? "translate-y-0" : "-translate-y-16"}`}
      >
        <nav
          className="grid w-full grid-cols-[minmax(max-content,1fr)_auto_minmax(max-content,1fr)] items-center gap-2 p-2 lg:px-6"
          aria-label="Global"
        >
          {/* Back on the left, tools for this screen in the middle, the main action on the right */}
          {isCalibrating ? (
            <>
              <div className="flex items-center justify-start gap-1">
                {/* Far left, so the show button can take its exact place when the menu is hidden */}
                <Tooltip description={t("menuHide")}>
                  <IconButton
                    className={`!p-1 border-2 border-black dark:border-white`}
                    onClick={() => setMenuStates({ ...menuStates, nav: false })}
                  >
                    <ExpandLessIcon ariaLabel={t("menuHide")} />
                  </IconButton>
                </Tooltip>
                <Tooltip description={t("cancelCalibrationDescription")}>
                  <Button
                    className={`${isDarkTheme(displaySettings.theme) ? "bg-black" : "bg-white"} !pl-1`}
                    color={buttonColor}
                    onClick={onCancelCalibration}
                  >
                    <KeyboardArrowLeftIcon ariaLabel="" />
                    {t("cancelCalibration")}
                  </Button>
                </Tooltip>
              </div>
              <div className="flex items-center justify-center gap-1">
                <Tooltip
                  description={
                    fullScreenHandle.active
                      ? t("fullscreenExit")
                      : t("fullscreen")
                  }
                  visible={fullScreenTooltipVisible}
                >
                  <IconButton
                    onClick={() => toggleFullScreen(fullScreenHandle)}
                  >
                    {fullScreenHandle.active ? (
                      <FullScreenIcon ariaLabel={t("fullscreen")} />
                    ) : (
                      <FullSceenExitIcon ariaLabel={t("fullscreenExit")} />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip description={t("invertColor")}>
                  <IconButton
                    onClick={() => {
                      const currentIdx = themes().indexOf(
                        displaySettings.theme,
                      );
                      const theme =
                        themes()[(currentIdx + 1) % themes().length];
                      setDisplaySettings({
                        ...displaySettings,
                        theme,
                      });
                    }}
                  >
                    {isDarkTheme(displaySettings.theme) ? (
                      <InvertColorIcon
                        fill={strokeColor(displaySettings.theme)}
                        ariaLabel={t("invertColor")}
                      />
                    ) : (
                      <InvertColorOffIcon ariaLabel={t("invertColorOff")} />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip
                  description={
                    showingMovePad ? t("hideMovement") : t("showMovement")
                  }
                >
                  <IconButton
                    active={showingMovePad}
                    onClick={() => setShowingMovePad(!showingMovePad)}
                  >
                    <MoveIcon
                      ariaLabel={
                        showingMovePad ? t("hideMovement") : t("showMovement")
                      }
                    />
                  </IconButton>
                </Tooltip>
                <div
                  aria-hidden
                  className="mx-1 hidden lg:block h-8 w-px bg-gray-300 dark:bg-gray-600"
                />
                <div className="flex gap-1">
                  <InlineInput
                    className="relative flex flex-col w-24"
                    inputClassName="pl-6 pr-7 w-24"
                    handleChange={handleWidthChange}
                    id="width"
                    label={t("width")}
                    labelRight={unitOfMeasure.toLocaleLowerCase()}
                    name="width"
                    value={widthInput}
                    type="number"
                    min="0"
                  />
                  <InlineInput
                    className="relative flex flex-col w-24"
                    inputClassName="pl-6 pr-7 w-24"
                    handleChange={handleHeightChange}
                    id="height"
                    label={t("height")}
                    labelRight={unitOfMeasure.toLocaleLowerCase()}
                    name="height"
                    value={heightInput}
                    type="number"
                    min="0"
                  />
                  <InlineSelect
                    handleChange={(e) =>
                      setUnitOfMeasure(e.target.value as Unit)
                    }
                    id="unit_of_measure"
                    name="unit_of_measure"
                    value={unitOfMeasure}
                    options={[
                      { value: Unit.IN, label: "in" },
                      { value: Unit.CM, label: "cm" },
                    ]}
                  />
                  <Tooltip description={t("lensCorrectionDescription")}>
                    <InlineInput
                      className="relative flex flex-col w-32"
                      inputClassName="pl-12 pr-6 w-32"
                      handleChange={handleLensCorrectionChange}
                      id="lens_correction"
                      inputTestId="lens-correction"
                      label={t("lensCorrection")}
                      labelRight="%"
                      name="lens_correction"
                      value={lensCorrectionInput}
                      type="number"
                      step="0.25"
                    />
                  </Tooltip>
                </div>
                <Tooltip description={t("delete")}>
                  <Button
                    className={` ${isDarkTheme(displaySettings.theme) ? "bg-black" : "bg-white"} !py-1.5 !px-3`}
                    color={buttonColor}
                    onClick={handleResetCalibration}
                    ariaLabel={t("delete")}
                  >
                    <RestartIcon ariaLabel="" />
                    <span className="hidden xl:flex">
                      {t("resetCalibration")}
                    </span>
                  </Button>
                </Tooltip>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  onClick={handleSaveCalibrationClick}
                  style={ButtonStyle.FILLED}
                  color={buttonColor}
                >
                  {t("saveCalibration")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-start gap-1">
                <Button
                  className={`${isDarkTheme(displaySettings.theme) ? "bg-black" : "bg-white"} ${fileInputClassNames ?? ""} !py-1.5 !pl-1 !pr-3`}
                  color={buttonColor}
                  onClick={showProjects}
                >
                  {fileLoadStatus === LoadStatusEnum.LOADING ? (
                    <LoadingSpinner className="mr-1 mt-0.5 w-4 h-4" />
                  ) : (
                    <KeyboardArrowLeftIcon ariaLabel="" />
                  )}
                  {t("projects")}
                </Button>
                <Tooltip description={t("calibrate")}>
                  <IconButton border onClick={onCalibrate}>
                    <SettingsIcon ariaLabel={t("calibrate")} />
                  </IconButton>
                </Tooltip>
              </div>
              <div className="flex items-center justify-center gap-1">
                <Tooltip
                  description={
                    fullScreenHandle.active
                      ? t("fullscreenExit")
                      : t("fullscreen")
                  }
                  visible={fullScreenTooltipVisible}
                >
                  <IconButton
                    onClick={() => toggleFullScreen(fullScreenHandle)}
                  >
                    {fullScreenHandle.active ? (
                      <FullScreenIcon ariaLabel={t("fullscreen")} />
                    ) : (
                      <FullSceenExitIcon ariaLabel={t("fullscreenExit")} />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip description={t("invertColor")}>
                  <IconButton
                    onClick={() => {
                      const currentIdx = themes().indexOf(
                        displaySettings.theme,
                      );
                      const theme =
                        themes()[(currentIdx + 1) % themes().length];
                      setDisplaySettings({
                        ...displaySettings,
                        theme,
                      });
                    }}
                  >
                    {isDarkTheme(displaySettings.theme) ? (
                      <InvertColorIcon
                        fill={strokeColor(displaySettings.theme)}
                        ariaLabel={t("invertColor")}
                      />
                    ) : (
                      <InvertColorOffIcon ariaLabel={t("invertColorOff")} />
                    )}
                  </IconButton>
                </Tooltip>
                <DropdownCheckboxIconButton
                  description={t("overlayOptions")}
                  icon={<GridOnIcon ariaLabel={t("overlayOptions")} />}
                  disabledIcon={<GridOffIcon ariaLabel={t("overlayOptions")} />}
                  disableOptionKey="disabled"
                  options={displaySettings.overlay}
                  optionSettings={overlayOptions}
                  setSelectedOptions={(options) => {
                    setDisplaySettings({
                      ...displaySettings,
                      overlay: {
                        ...displaySettings.overlay,
                        ...options,
                      },
                    });
                  }}
                />
                <DropdownIconButton
                  loadStatus={lineThicknessStatus}
                  dropdownClassName="w-fit -left-5"
                  description={t("lineWeight")}
                  icon={<LineWeightIcon ariaLabel={t("lineWeight")} />}
                  options={lineThicknessOptions}
                  setSelection={setLineThickness}
                  selection={lineThickness}
                />
                <div
                  aria-hidden
                  className="mx-1 hidden lg:block h-8 w-px bg-gray-300 dark:bg-gray-600"
                />
                <Tooltip description={t("flipHorizontal")}>
                  <IconButton
                    onClick={handleFlipHorizontal}
                    disabled={zoomedOut || magnifying}
                  >
                    <FlipVerticalIcon ariaLabel={t("flipHorizontal")} />
                  </IconButton>
                </Tooltip>
                <Tooltip description={t("flipVertical")}>
                  <IconButton
                    onClick={handleFlipVertical}
                    disabled={zoomedOut || magnifying}
                  >
                    <FlipHorizontalIcon ariaLabel={t("flipVertical")} />
                  </IconButton>
                </Tooltip>
                <Tooltip description={t("rotate90")}>
                  <IconButton
                    onClick={handleRotate90}
                    disabled={zoomedOut || magnifying}
                  >
                    <Rotate90DegreesCWIcon ariaLabel={t("rotate90")} />
                  </IconButton>
                </Tooltip>
                <Tooltip description={t("recenter")}>
                  <IconButton
                    disabled={zoomedOut || magnifying}
                    onClick={handleRecenterReset}
                  >
                    <RecenterIcon ariaLabel={t("recenter")} />
                  </IconButton>
                </Tooltip>
                <Tooltip description={t("magnify")}>
                  <IconButton
                    onClick={() => setMagnifying(!magnifying)}
                    active={magnifying}
                    disabled={zoomedOut}
                  >
                    <ZoomInIcon ariaLabel={t("magnify")} />
                  </IconButton>
                </Tooltip>
                <Tooltip description={t("zoomOut")}>
                  <IconButton
                    onClick={() => setZoomedOut(!zoomedOut)}
                    active={zoomedOut}
                    disabled={magnifying}
                  >
                    <ZoomOutIcon ariaLabel={t("zoomOut")} />
                  </IconButton>
                </Tooltip>
                <Tooltip description={t("measure")}>
                  <IconButton
                    onClick={() => setMeasuring(!measuring)}
                    active={measuring}
                  >
                    <MarkAndMeasureIcon ariaLabel={t("measure")} />
                  </IconButton>
                </Tooltip>
              </div>
              <div />
            </>
          )}
        </nav>
      </header>
    </>
  );
}
