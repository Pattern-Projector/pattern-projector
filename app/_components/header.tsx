import { useTranslations } from "next-intl";
import { ChangeEvent, Dispatch, SetStateAction, useState } from "react";
import { FullScreenHandle } from "react-full-screen";

import FileInput from "@/_components/file-input";
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
import { CM, IN } from "@/_lib/unit";
import RecenterIcon from "@/_icons/recenter-icon";
import { getCenterPoint } from "@/_lib/geometry";
import { visible } from "@/_components/theme/css-functions";
import { IconButton } from "@/_components/buttons/icon-button";
import { DropdownCheckboxIconButton } from "@/_components/buttons/dropdown-checkbox-icon-button";
import Tooltip from "@/_components/tooltip/tooltip";
import FullscreenExitIcon from "@/_icons/fullscreen-exit-icon";
import ExpandLessIcon from "@/_icons/expand-less-icon";
import LineWeightIcon from "@/_icons/line-weight-icon";
import FlexWrapIcon from "@/_icons/flex-wrap-icon";
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

export default function Header({
  isCalibrating,
  setIsCalibrating,
  height,
  width,
  handleHeightChange,
  handleWidthChange,
  handleResetCalibration,
  handleFileChange,
  fullScreenHandle,
  unitOfMeasure,
  setUnitOfMeasure,
  displaySettings,
  setDisplaySettings,
  pageCount,
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
}: {
  isCalibrating: boolean;
  setIsCalibrating: Dispatch<SetStateAction<boolean>>;
  height: string;
  width: string;
  handleHeightChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleWidthChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleResetCalibration: () => void;
  fullScreenHandle: FullScreenHandle;
  unitOfMeasure: string;
  setUnitOfMeasure: (newUnit: string) => void;
  displaySettings: DisplaySettings;
  setDisplaySettings: (newDisplaySettings: DisplaySettings) => void;
  pageCount: number;
  layoutWidth: number;
  layoutHeight: number;
  lineThickness: number;
  setLineThickness: Dispatch<SetStateAction<number>>;
  measuring: boolean;
  setMeasuring: Dispatch<SetStateAction<boolean>>;
  menuStates: MenuStates;
  setMenuStates: Dispatch<SetStateAction<MenuStates>>;
  showingMovePad: boolean;
  setShowingMovePad: Dispatch<SetStateAction<boolean>>;
  setCalibrationValidated: Dispatch<SetStateAction<boolean>>;
  fullScreenTooltipVisible: boolean;
}) {
  const [calibrationAlert, setCalibrationAlert] = useState("");
  const transformer = useTransformerContext();
  const t = useTranslations("Header");

  function saveContextAndProject(e: React.MouseEvent<HTMLButtonElement>) {
    const current = getCalibrationContextUpdatedWithEvent(
      e,
      fullScreenHandle.active,
    );
    localStorage.setItem("calibrationContext", JSON.stringify(current));
    setCalibrationValidated(true);
    setIsCalibrating(false);
  }

  function handleCalibrateProjectButtonClick(
    e: React.PointerEvent<HTMLButtonElement>,
  ) {
    if (isCalibrating) {
      const expectedContext = localStorage.getItem("calibrationContext");
      if (expectedContext) {
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
    transformer.rotate(getCenterPoint(+width, +height, unitOfMeasure), 90);
  };

  const handleFlipHorizontal = () => {
    transformer.flipHorizontal(getCenterPoint(+width, +height, unitOfMeasure));
  };

  const handleFlipVertical = () => {
    transformer.flipVertical(getCenterPoint(+width, +height, unitOfMeasure));
  };

  const handleRecenter = () => {
    transformer.recenter(
      getCenterPoint(+width, +height, unitOfMeasure),
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
  ];

  useKeyDown(() => {
    handleFlipHorizontal();
  }, [KeyCode.KeyH]);

  useKeyDown(() => {
    handleFlipVertical();
  }, [KeyCode.KeyV]);

  useKeyDown(() => {
    handleRecenter();
  }, [KeyCode.KeyC]);

  useKeyDown(() => {
    handleRotate90();
  }, [KeyCode.KeyR]);

  useKeyDown(() => {
    setMeasuring(!measuring);
  }, [KeyCode.KeyM]);

  return (
    <>
      <Modal open={calibrationAlert.length > 0}>
        <ModalTitle>{t("calibrationAlertTitle")}</ModalTitle>
        <ModalText>{calibrationAlert}</ModalText>
        <ModalActions>
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
        </ModalActions>
      </Modal>
      <header
        className={`relative z-10 bg-white dark:bg-black left-0 w-full border-b dark:border-gray-700 transition-all duration-500 h-16 flex items-center ${menuStates.nav ? "translate-y-0" : "-translate-y-16"}`}
      >
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between p-2 lg:px-8 w-full"
          aria-label="Global"
        >
          <div className="flex items-center gap-2">
            <Tooltip
              description={
                fullScreenHandle.active ? t("fullscreenExit") : t("fullscreen")
              }
              visible={fullScreenTooltipVisible}
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
            <Tooltip description={t("menuHide")}>
              <IconButton
                className={`!p-1 border-2 border-black dark:border-white`}
                onClick={() => setMenuStates({ ...menuStates, nav: false })}
              >
                <ExpandLessIcon ariaLabel={t("menuHide")} />
              </IconButton>
            </Tooltip>
            <Tooltip
              description={
                menuStates.stitch
                  ? t("stitchMenuHide")
                  : pageCount === 0
                    ? t("stitchMenuDisabled")
                    : t("stitchMenuShow")
              }
            >
              <IconButton
                disabled={pageCount === 0}
                onClick={() =>
                  setMenuStates({ ...menuStates, stitch: !menuStates.stitch })
                }
                className={`${menuStates.stitch ? "!bg-gray-300 dark:!bg-gray-600" : ""} ${visible(!isCalibrating)}`}
              >
                <FlexWrapIcon
                  ariaLabel={
                    menuStates.stitch
                      ? t("stitchMenuHide")
                      : t("stitchMenuShow")
                  }
                />
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
                dropdownClassName="w-fit -left-5"
                description={t("lineWeight")}
                icon={<LineWeightIcon ariaLabel={t("lineWeight")} />}
                options={lineThicknessOptions}
                setSelection={setLineThickness}
                selection={lineThickness}
              />
            )}
          </div>
          <div className={`flex items-center gap-2 ${visible(isCalibrating)}`}>
            <div className="flex gap-1">
              <InlineInput
                className="relative flex flex-col"
                inputClassName="pl-6 pr-7 w-24"
                handleChange={handleWidthChange}
                id="width"
                label={t("width")}
                labelRight={unitOfMeasure.toLocaleLowerCase()}
                name="width"
                value={width}
                type="number"
                min="0"
              />
              <InlineInput
                className="relative flex flex-col"
                inputClassName="pl-6 pr-7 w-24"
                handleChange={handleHeightChange}
                id="height"
                label={t("height")}
                labelRight={unitOfMeasure.toLocaleLowerCase()}
                name="height"
                value={height}
                type="number"
                min="0"
              />
              <InlineSelect
                handleChange={(e) => setUnitOfMeasure(e.target.value)}
                id="unit_of_measure"
                name="unit_of_measure"
                value={unitOfMeasure}
                options={[
                  { value: IN, label: "in" },
                  { value: CM, label: "cm" },
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
          <div className={`flex items-center gap-2 ${visible(!isCalibrating)}`}>
            <Tooltip description={t("flipHorizontal")}>
              <IconButton onClick={handleFlipHorizontal}>
                <FlipVerticalIcon ariaLabel={t("flipHorizontal")} />
              </IconButton>
            </Tooltip>
            <Tooltip description={t("flipVertical")}>
              <IconButton onClick={handleFlipVertical}>
                <FlipHorizontalIcon ariaLabel={t("flipVertical")} />
              </IconButton>
            </Tooltip>
            <Tooltip description={t("rotate90")}>
              <IconButton onClick={handleRotate90}>
                <Rotate90DegreesCWIcon ariaLabel={t("rotate90")} />
              </IconButton>
            </Tooltip>
            <Tooltip description={t("recenter")}>
              <IconButton
                onClick={() => {
                  transformer.reset();
                  transformer.recenter(
                    getCenterPoint(+width, +height, unitOfMeasure),
                    layoutWidth,
                    layoutHeight,
                  );
                }}
              >
                <RecenterIcon ariaLabel={t("recenter")} />
              </IconButton>
            </Tooltip>
            <Tooltip description={t("measure")}>
              <IconButton
                onClick={() => setMeasuring(!measuring)}
                className={`${measuring ? "!bg-gray-300 dark:!bg-gray-700" : ""}`}
              >
                <MarkAndMeasureIcon ariaLabel={t("measure")} />
              </IconButton>
            </Tooltip>
          </div>
          <div className="flex items-center gap-4">
            <label
              className={`${visible(
                !isCalibrating,
              )} flex gap-2 items-center outline outline-purple-600 text-purple-600 focus:ring-2 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800  hover:bg-purple-600 hover:text-white font-medium rounded-lg text-sm px-2 py-1.5 hover:bg-none text-center`}
            >
              <FileInput
                accept="application/pdf"
                className="hidden"
                handleChange={handleFileChange}
                id="pdfFile"
              ></FileInput>
              <PdfIcon ariaLabel={t("openPDF")} fill="currentColor" />
              {t("openPDF")}
            </label>
            <button
              className="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900"
              onClick={handleCalibrateProjectButtonClick}
            >
              {isCalibrating ? t("project") : t("calibrate")}
            </button>
            <Tooltip description={t("info")}>
              <IconButton href="/">
                <InfoIcon ariaLabel={t("info")} />
              </IconButton>
            </Tooltip>
          </div>
        </nav>
      </header>
    </>
  );
}
