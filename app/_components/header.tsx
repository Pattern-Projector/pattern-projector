import { useTranslations } from "next-intl";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FullScreenHandle } from "react-full-screen";

import InlineInput from "@/_components/inline-input";
import InlineSelect from "@/_components/inline-select";
import DeleteIcon from "@/_icons/delete-icon";
import FlipHorizontalIcon from "@/_icons/flip-horizontal-icon";
import FlipVerticalIcon from "@/_icons/flip-vertical-icon";
import FlipCenterOnIcon from "@/_icons/flip-center-on-icon";
import GridOffIcon from "@/_icons/grid-off-icon";
import GridOnIcon from "@/_icons/grid-on-icon";
import OverlayBorderIcon from "@/_icons/overlay-border-icon";
import OverlayPaperIcon from "@/_icons/overlay-paper-icon";
import InfoIcon from "@/_icons/info-icon";
import InvertColorIcon from "@/_icons/invert-color-icon";
import InvertColorOffIcon from "@/_icons/invert-color-off-icon";
import PdfIcon from "@/_icons/pdf-icon";
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
import { visible } from "@/_components/theme/css-functions";
import { IconButton } from "@/_components/buttons/icon-button";
import { DropdownCheckboxIconButton } from "@/_components/buttons/dropdown-checkbox-icon-button";
import Tooltip from "@/_components/tooltip/tooltip";
import ExpandLessIcon from "@/_icons/expand-less-icon";
import LineWeightIcon from "@/_icons/line-weight-icon";
import { useKeyDown } from "@/_hooks/use-key-down";
import { KeyCode } from "@/_lib/key-code";
import { MenuStates } from "@/_lib/menu-states";
import MoveIcon from "@/_icons/move-icon";
import {
  getCalibrationContextUpdatedWithEvent,
  getIsInvalidatedCalibrationContextWithPointerEvent,
} from "@/_lib/calibration-context";
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
import { ButtonStyle, getButtonStyleClasses } from "./theme/styles";
import { ButtonColor, getColorClasses } from "./theme/colors";
import MailIcon from "@/_icons/mail-icon";
import ZoomInIcon from "@/_icons/zoom-in-icon";
import { acceptedMimeTypes } from "@/_lib/is-valid-file";
import { toggleFullScreen } from "@/_lib/full-screen";

export default function Header({
  isCalibrating,
  setIsCalibrating,
  widthInput,
  heightInput,
  width,
  height,
  handleHeightChange,
  handleWidthChange,
  handleResetCalibration,
  handleFileChange,
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
  setCalibrationValidated,
  fullScreenTooltipVisible,
  magnifying,
  setMagnifying,
  zoomedOut,
  setZoomedOut,
  fileLoadStatus,
  lineThicknessStatus,
  buttonColor,
  mailOpen,
  setMailOpen,
  invalidCalibration,
  file,
}: {
  isCalibrating: boolean;
  setIsCalibrating: Dispatch<SetStateAction<boolean>>;
  widthInput: string;
  heightInput: string;
  width: number;
  height: number;
  handleHeightChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleWidthChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
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
  setCalibrationValidated: Dispatch<SetStateAction<boolean>>;
  fullScreenTooltipVisible: boolean;
  magnifying: boolean;
  setMagnifying: Dispatch<SetStateAction<boolean>>;
  zoomedOut: boolean;
  setZoomedOut: Dispatch<SetStateAction<boolean>>;
  fileLoadStatus: LoadStatusEnum;
  lineThicknessStatus: LoadStatusEnum;
  buttonColor: ButtonColor;
  mailOpen: boolean;
  setMailOpen: Dispatch<SetStateAction<boolean>>;
  invalidCalibration: boolean;
  file: File | null;
}) {
  const [calibrationAlert, setCalibrationAlert] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mailRead = useRef(true);
  const transformer = useTransformerContext();
  const t = useTranslations("Header");

  const fileInputClassNames = useMemo(() => {
    if (!isCalibrating && fileLoadStatus === LoadStatusEnum.LOADING) {
      return "outline-gray-50 !text-gray-50 !bg-gray-500";
    }
  }, [isCalibrating, fileLoadStatus]);

  function saveContextAndProject(e: React.MouseEvent<HTMLButtonElement>) {
    const current = getCalibrationContextUpdatedWithEvent(
      e,
      fullScreenHandle.active,
    );
    localStorage.setItem("calibrationContext", JSON.stringify(current));
    setCalibrationValidated(true);
    setIsCalibrating(false);

    if (file === null && fileInputRef.current !== null) {
      fileInputRef.current.click();
    }
  }

  function handleCalibrateProjectButtonClick(
    e: React.PointerEvent<HTMLButtonElement>,
  ) {
    if (isCalibrating) {
      const expectedContext = localStorage.getItem("calibrationContext");
      if (invalidCalibration) {
        setCalibrationAlert(t("invalidCalibration"));
      } else if (expectedContext) {
        const expected = JSON.parse(expectedContext);
        if (
          getIsInvalidatedCalibrationContextWithPointerEvent(
            expected,
            e,
            fullScreenHandle.active,
            true,
          )
        ) {
          // Give user a chance to recalibrate or continue.
          setCalibrationAlert(t("calibrationAlertContinue"));
        } else {
          saveContextAndProject(e);
        }
      } else {
        saveContextAndProject(e);
      }
    } else {
      // go to calibration.
      setIsCalibrating(true);
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

  const handleOpenMail = () => {
    setMailOpen(true);
    localStorage.setItem("mailRead", Date.now().toString());
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

  useEffect(() => {
    const mailReadDate = localStorage.getItem("mailRead");
    if (mailReadDate) {
      const mailReadTime = parseInt(mailReadDate);
      const lastReleaseDate = new Date("2025-04-22").getTime();
      // If mail was read after the last release date, style mail as read.
      if (mailReadTime > lastReleaseDate) {
        mailRead.current = true;
      } else {
        mailRead.current = false;
      }
    } else {
      mailRead.current = false;
    }
  }, [mailOpen]);

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
          {invalidCalibration ? (
            <Button
              onClick={() => {
                handleResetCalibration();
                setCalibrationAlert("");
              }}
            >
              <DeleteIcon ariaLabel={t("delete")} />
              {t("delete")}
            </Button>
          ) : (
            <>
              <Button
                onClick={(e) => {
                  saveContextAndProject(e);
                  setCalibrationAlert("");
                }}
              >
                {t("continue")}
              </Button>
              <Button
                onClick={() => {
                  setIsCalibrating(true);
                  setCalibrationAlert("");
                }}
              >
                {t("checkCalibration")}
              </Button>
            </>
          )}
        </ModalActions>
      </Modal>
      <header
        className={`relative z-10 bg-opacity-60 dark:bg-opacity-50 bg-white dark:bg-black left-0 w-full border-b dark:border-gray-700 transition-all duration-500 h-16 flex items-center ${menuStates.nav ? "translate-y-0" : "-translate-y-16"}`}
      >
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between p-2 lg:px-8 w-full"
          aria-label="Global"
        >
          <div className="flex items-center gap-1">
            <Tooltip
              className={visible(isCalibrating || fullScreenHandle.active)}
              description={
                fullScreenHandle.active ? t("fullscreenExit") : t("fullscreen")
              }
              visible={fullScreenTooltipVisible}
            >
              <IconButton onClick={() => toggleFullScreen(fullScreenHandle)}>
                {fullScreenHandle.active ? (
                  <FullScreenIcon ariaLabel={t("fullscreen")} />
                ) : (
                  <FullSceenExitIcon ariaLabel={t("fullscreenExit")} />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip
              description={t("menuHide")}
              className={visible(isCalibrating)}
            >
              <IconButton
                className={`!p-1 border-2 border-black dark:border-white`}
                onClick={() => setMenuStates({ ...menuStates, nav: false })}
              >
                <ExpandLessIcon ariaLabel={t("menuHide")} />
              </IconButton>
            </Tooltip>
            <Tooltip description={t("invertColor")}>
              <IconButton
                onClick={() => {
                  const currentIdx = themes().indexOf(displaySettings.theme);
                  const theme = themes()[(currentIdx + 1) % themes().length];
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
            {!isCalibrating && (
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
            )}
            {!isCalibrating && (
              <DropdownIconButton
                loadStatus={lineThicknessStatus}
                dropdownClassName="w-fit -left-5"
                description={t("lineWeight")}
                icon={<LineWeightIcon ariaLabel={t("lineWeight")} />}
                options={lineThicknessOptions}
                setSelection={setLineThickness}
                selection={lineThickness}
              />
            )}
          </div>
          <div className={`flex items-center gap-1 ${visible(isCalibrating)}`}>
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
                handleChange={(e) => setUnitOfMeasure(e.target.value as Unit)}
                id="unit_of_measure"
                name="unit_of_measure"
                value={unitOfMeasure}
                options={[
                  { value: Unit.IN, label: "in" },
                  { value: Unit.CM, label: "cm" },
                ]}
              />
            </div>
            <Tooltip description={t("delete")}>
              <IconButton
                className={`${visible(isCalibrating)}`}
                onClick={handleResetCalibration}
              >
                <DeleteIcon ariaLabel={t("delete")} />
              </IconButton>
            </Tooltip>
            <Tooltip
              description={
                showingMovePad ? t("hideMovement") : t("showMovement")
              }
            >
              <IconButton
                className={`${visible(isCalibrating)}`}
                onClick={() => setShowingMovePad(!showingMovePad)}
              >
                <MoveIcon
                  ariaLabel={
                    showingMovePad ? t("hideMovement") : t("showMovement")
                  }
                />
              </IconButton>
            </Tooltip>
          </div>
          <div className={`flex items-center gap-1 ${visible(!isCalibrating)}`}>
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
          <div className="flex items-center gap-2">
            <label
              className={`${visible(
                !isCalibrating,
              )} flex gap-2 items-center ${isDarkTheme(displaySettings.theme) ? "bg-black" : "bg-white"} ${fileInputClassNames} ${getButtonStyleClasses(ButtonStyle.OUTLINE)} ${getColorClasses(buttonColor, ButtonStyle.OUTLINE)} !py-1.5 !px-3`}
            >
              <input
                ref={fileInputRef}
                disabled={
                  fileLoadStatus === LoadStatusEnum.LOADING && !isCalibrating
                }
                accept={acceptedMimeTypes.join(",")}
                className="hidden"
                id="pdfFile"
                onChange={handleFileChange}
                type="file"
              />
              {fileLoadStatus === LoadStatusEnum.LOADING && !isCalibrating ? (
                <LoadingSpinner className="mr-1 mt-0.5 w-4 h-4" />
              ) : (
                <PdfIcon ariaLabel={t("openPDF")} fill="currentColor" />
              )}
              <span className="hidden md:flex">{t("openPDF")}</span>
            </label>
            <Button
              onClick={handleCalibrateProjectButtonClick}
              className="flex align-middle"
              style={ButtonStyle.FILLED}
              color={buttonColor}
            >
              {isCalibrating ? t("project") : t("calibrate")}
            </Button>
            <Tooltip description={t("info")} className={visible(isCalibrating)}>
              <IconButton href="/">
                <InfoIcon ariaLabel={t("info")} />
              </IconButton>
            </Tooltip>
            <Tooltip description={t("mail")} className={visible(isCalibrating)}>
              <IconButton
                onClick={() => handleOpenMail()}
                active={!mailRead.current}
              >
                <MailIcon ariaLabel={t("mail")} />
              </IconButton>
            </Tooltip>
          </div>
        </nav>
      </header>
    </>
  );
}
