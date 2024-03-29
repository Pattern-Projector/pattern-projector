import { useTranslations } from "next-intl";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
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
import { DisplaySettings } from "@/_lib/display-settings";
import { CM, IN } from "@/_lib/unit";
import RecenterIcon from "@/_icons/recenter-icon";
import Matrix, { inverse } from "ml-matrix";
import {
  translate,
  rotateMatrixDeg,
  flipVertical,
  flipHorizontal,
  getCenterPoint,
  transformPoint,
} from "@/_lib/geometry";
import FourCorners from "@/_icons/four-corners";
import FourCornersOff from "@/_icons/four-corners-off";
import { visible } from "@/_components/theme/css-functions";
import { IconButton } from "@/_components/buttons/icon-button";
import { DropdownCheckboxIconButton } from "@/_components/buttons/dropdown-checkbox-icon-button";
import Tooltip from "@/_components/tooltip/tooltip";
import FullscreenExitIcon from "@/_icons/fullscreen-exit-icon";
import ExpandLessIcon from "@/_icons/expand-less-icon";
import ExpandMoreIcon from "@/_icons/expand-more-icon";
import LineWeightIcon from "@/_icons/line-weight-icon";
import FlexWrapIcon from "@/_icons/flex-wrap-icon";
import SquareFootIcon from "@/_icons/square-foot";
import { useKeyDown } from "@/_hooks/use-key-down";
import { KeyCode } from "@/_lib/key-code";
import { MenuStates } from "@/_lib/menu-states";

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
  localTransform,
  setLocalTransform,
  layoutWidth,
  layoutHeight,
  lineThickness,
  setLineThickness,
  measuring,
  setMeasuring,
  menuStates,
  setMenuStates,
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
  localTransform: Matrix;
  setLocalTransform: Dispatch<SetStateAction<Matrix>>;
  layoutWidth: number;
  layoutHeight: number;
  lineThickness: number;
  setLineThickness: Dispatch<SetStateAction<number>>;
  measuring: boolean;
  setMeasuring: Dispatch<SetStateAction<boolean>>;
  menuStates: MenuStates;
  setMenuStates: Dispatch<SetStateAction<MenuStates>>;
}) {
  const t = useTranslations("Header");

  const [invertOpen, setInvertOpen] = useState<boolean>(false);

  function handleRecenter() {
    const current = transformPoint(
      { x: layoutWidth * 0.5, y: layoutHeight * 0.5 },
      localTransform,
    );
    const center = getCenterPoint(+width, +height);
    const p = {
      x: center.x - current.x,
      y: center.y - current.y,
    };
    setLocalTransform(translate(p).mmul(localTransform));
  }

  useEffect(() => {
    if (fullScreenHandle.active) {
      setMenuStates({ ...menuStates, nav: false, layers: false });
      // TODO setup button hides
    } else {
      setMenuStates({ ...menuStates, nav: true });
    }
  }, [fullScreenHandle.active]);

  const overlayOptions = {
    disabled: {
      icon: <GridOffIcon ariaLabel={t("overlayOptionDisabled")} />,
      text: t("overlayOptionDisabled"),
      selected: displaySettings.overlay.disabled,
    },
    grid: {
      icon: <GridOnIcon ariaLabel={t("overlayOptionGrid")} />,
      text: t("overlayOptionGrid"),
      selected: displaySettings.overlay.grid,
    },
    border: {
      icon: <OverlayBorderIcon ariaLabel={t("overlayOptionBorder")} />,
      text: t("overlayOptionBorder"),
      selected: displaySettings.overlay.border,
    },
    paper: {
      icon: <OverlayPaperIcon ariaLabel={t("overlayOptionPaper")} />,
      text: t("overlayOptionPaper"),
      selected: displaySettings.overlay.paper,
    },
    fliplines: {
      icon: <FlipCenterOnIcon ariaLabel={t("overlayOptionFliplines")} />,
      text: t("overlayOptionFliplines"),
      selected: displaySettings.overlay.fliplines,
    },
  };

  useKeyDown(() => {
    setMeasuring(!measuring);
  }, [KeyCode.KeyM]);

  return (
    <>
      <header
        className={`bg-white dark:bg-black absolute left-0 w-full z-30 border-b dark:border-gray-700 transition-all duration-700 h-16 flex items-center ${menuStates.nav ? "top-0" : "-top-20"}`}
      >
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between p-2 lg:px-8 w-full"
          aria-label="Global"
        >
          <div className="flex items-center gap-2">
            <h1>{isCalibrating ? t("calibrating") : t("projecting")}</h1>

            <Tooltip
              description={
                fullScreenHandle.active ? t("fullscreenExit") : t("fullscreen")
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
            <IconButton
              className={`!p-1 border-2 border-slate-400 dark:border-white`}
              onClick={() => setMenuStates({ ...menuStates, nav: false })}
            >
              <ExpandLessIcon ariaLabel={t("menuHide")} />
            </IconButton>
            <Tooltip description={t("invertColor")}>
              <IconButton
                onClick={(e) => {
                  let newInverted;
                  let newIsGreenInverted;
                  if (!displaySettings.inverted) {
                    newInverted = true;
                    newIsGreenInverted = true;
                  } else if (displaySettings.isInvertedGreen) {
                    newInverted = true;
                    newIsGreenInverted = false;
                  } else {
                    newInverted = false;
                    newIsGreenInverted = false;
                  }
                  setDisplaySettings({
                    ...displaySettings,
                    inverted: newInverted,
                    isInvertedGreen: newIsGreenInverted,
                  });
                  setInvertOpen(!displaySettings.inverted);
                }}
              >
                {displaySettings.inverted ? (
                  <InvertColorIcon
                    fill={
                      displaySettings.isInvertedGreen
                        ? "#32CD32"
                        : "currentColor"
                    }
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
                options={overlayOptions}
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
          </div>
          <div className={`flex items-center gap-2 ${visible(isCalibrating)}`}>
            <div className="flex gap-1">
              <InlineInput
                className="relative flex flex-col"
                inputClassName="pl-6 pr-7"
                handleChange={handleHeightChange}
                id="height"
                label={t("height")}
                labelRight={unitOfMeasure === CM ? "cm" : "in"}
                name="height"
                value={height}
              />
              <InlineInput
                className="relative flex flex-col"
                inputClassName="pl-6 pr-7"
                handleChange={handleWidthChange}
                id="height"
                label={t("width")}
                labelRight={unitOfMeasure === CM ? "cm" : "in"}
                name="width"
                value={width}
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
          </div>
          <div className={`flex items-center gap-2 ${visible(!isCalibrating)}`}>
            <Tooltip
              description={
                menuStates.stitch ? t("stitchMenuHide") : t("stitchMenuShow")
              }
              className={`${visible(pageCount > 1)}`}
            >
              <IconButton
                onClick={() =>
                  setMenuStates({ ...menuStates, stitch: !menuStates.stitch })
                }
                className={
                  menuStates.stitch ? "!bg-gray-300 dark:!bg-gray-600" : ""
                }
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
            <Tooltip description={t("lineWeight")}>
              <div className="flex">
                <InlineInput
                  inputClassName="!px-2"
                  label={<LineWeightIcon ariaLabel={t("lineWeight")} />}
                  className="align-right"
                  min="0"
                  type="number"
                  handleChange={(e) => setLineThickness(e.target.valueAsNumber)}
                  value={String(lineThickness)}
                />
              </div>
            </Tooltip>

            <Tooltip description={t("flipHorizontal")}>
              <IconButton
                onClick={() =>
                  setLocalTransform(
                    flipHorizontal(
                      getCenterPoint(+width, +height),
                    ).mmul(localTransform),
                  )
                }
              >
                <FlipVerticalIcon ariaLabel={t("flipHorizontal")} />
              </IconButton>
            </Tooltip>
            <Tooltip description={t("flipVertical")}>
              <IconButton
                onClick={() =>
                  setLocalTransform(
                    flipVertical(
                      getCenterPoint(+width, +height),
                    ).mmul(localTransform),
                  )
                }
              >
                <FlipHorizontalIcon ariaLabel={t("flipVertical")} />
              </IconButton>
            </Tooltip>
            <Tooltip description={t("rotate90")}>
              <IconButton
                onClick={() =>
                  setLocalTransform(
                    rotateMatrixDeg(
                      90,
                      getCenterPoint(+width, +height),
                    ).mmul(localTransform),
                  )
                }
              >
                <Rotate90DegreesCWIcon ariaLabel={t("rotate90")} />
              </IconButton>
            </Tooltip>
            <Tooltip description={t("recenter")}>
              <IconButton onClick={handleRecenter}>
                <RecenterIcon ariaLabel={t("recenter")} />
              </IconButton>
            </Tooltip>
            <Tooltip description={measuring ? t("measureOff") : t("measureOn")}>
              <IconButton
                onClick={() => setMeasuring(!measuring)}
                className={`${measuring ? "!bg-gray-300 dark:!bg-gray-700" : ""}`}
              >
                <SquareFootIcon
                  ariaLabel={measuring ? t("measureOff") : t("measureOn")}
                />
              </IconButton>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
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
              className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              onClick={() => setIsCalibrating(!isCalibrating)}
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
      <IconButton
        className={`!p-1 border-2 border-slate-400 dark:border-white absolute ${menuStates.nav ? "-top-16" : "top-2"} transition-all duration-700 z-30 left-1/4 focus:ring-0`}
        onClick={() => setMenuStates({ ...menuStates, nav: true })}
      >
        <ExpandMoreIcon ariaLabel={t("menuShow")} />
      </IconButton>
    </>
  );
}
