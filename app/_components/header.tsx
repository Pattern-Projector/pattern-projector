import { useTranslations } from "next-intl";
import { getPtDensity } from "@/_lib/unit";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { OverlayMode } from "@/_lib/drawing";
import { FullScreenHandle } from "react-full-screen";

import FileInput from "@/_components/file-input";
import InlineInput from "@/_components/inline-input";
import InlineSelect from "@/_components/inline-select";
import DeleteIcon from "@/_icons/delete-icon";
import FlipHorizontalIcon from "@/_icons/flip-horizontal-icon";
import FlipHorizontalOffIcon from "@/_icons/flip-horizontal-off-icon";
import FlipVerticalIcon from "@/_icons/flip-vertical-icon";
import FlipVerticalOffIcon from "@/_icons/flip-vertical-off-icon";
import GridOffIcon from "@/_icons/grid-off-icon";
import GridOnIcon from "@/_icons/grid-on-icon";
import OverlayBorderIcon from "@/_icons/overlay-border-icon";
import OverlayPaperIcon from "@/_icons/overlay-paper-icon";
import InfoIcon from "@/_icons/info-icon";
import InvertColorIcon from "@/_icons/invert-color-icon";
import InvertColorOffIcon from "@/_icons/invert-color-off-icon";
import PdfIcon from "@/_icons/pdf-icon";
import Rotate90DegreesCWIcon from "@/_icons/rotate-90-degrees-cw-icon";
import { TransformSettings } from "@/_lib/transform-settings";
import { DisplaySettings } from "@/_lib/display-settings";
import { CM, IN } from "@/_lib/unit";
import RecenterIcon from "@/_icons/recenter-icon";
import Matrix from "ml-matrix";
import {
  translate,
  rotateMatrixDeg,
  flipMatrixHorizontally,
  flipMatrixVertically,
  isMatrixFlippedVertically,
  isMatrixFlippedHorizontally,
  overrideTranslationFromMatrix,
} from "@/_lib/geometry";
import FourCorners from "@/_icons/four-corners";
import FourCornersOff from "@/_icons/four-corners-off";
import { visible } from "@/_components/theme/css-functions";
import { IconButton } from "@/_components/buttons/icon-button";
import { DropdownIconButton } from "@/_components/buttons/dropdown-icon-button";
import Tooltip from "@/_components/tooltip/tooltip";
import { Layer } from "@/_lib/layer";
import FullscreenExitIcon from "@/_icons/fullscreen-exit-icon";
import ExpandLessIcon from "@/_icons/expand-less-icon";
import ExpandMoreIcon from "@/_icons/expand-more-icon";
import LineWeightIcon from "@/_icons/line-weight-icon";
import FlexWrapIcon from "@/_icons/flex-wrap-icon";

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
  transformSettings,
  setTransformSettings,
  displaySettings,
  setDisplaySettings,
  pageCount,
  layers,
  showLayerMenu,
  setShowLayerMenu,
  localTransform,
  calibrationTransform,
  setLocalTransform,
  layoutWidth,
  layoutHeight,
  setShowStitchMenu,
  showStitchMenu,
  lineThickness,
  setLineThickness,
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
  transformSettings: TransformSettings;
  setTransformSettings: Dispatch<SetStateAction<TransformSettings>>;
  displaySettings: DisplaySettings;
  setDisplaySettings: (newDisplaySettings: DisplaySettings) => void;
  pageCount: number;
  layers: Map<string, Layer>;
  showLayerMenu: boolean;
  setShowLayerMenu: Dispatch<SetStateAction<boolean>>;
  localTransform: Matrix;
  calibrationTransform: Matrix;
  setLocalTransform: Dispatch<SetStateAction<Matrix>>;
  layoutWidth: number;
  layoutHeight: number;
  lineThickness: number;
  setLineThickness: Dispatch<SetStateAction<number>>;
  setShowStitchMenu: Dispatch<SetStateAction<boolean>>;
  showStitchMenu: boolean;
}) {
  const t = useTranslations("Header");

  const [invertOpen, setInvertOpen] = useState<boolean>(false);
  const [showNav, setShowNav] = useState<boolean>(true);

  function handleRecenter() {
    if (transformSettings.matrix !== null) {
      let tx = +width / 2;
      let ty = +height / 2;
      
      const m = translate({ x: tx, y: ty});
      const newTransformMatrix = overrideTranslationFromMatrix(
        transformSettings.matrix, m);
      setTransformSettings({
       ...transformSettings,
        matrix: newTransformMatrix,
      })
    }
  }

  useEffect(() => {
    if (fullScreenHandle.active) {
      setShowNav(false);
    } else {
      setShowNav(true);
    }
  }, [fullScreenHandle.active]);

  const overlayOptions = [
    {
      icon: <GridOffIcon ariaLabel={t("overlayModeOff")} />,
      text: t("overlayModeOff"),
      value: OverlayMode.NONE
    },{
      icon: <GridOnIcon ariaLabel={t("overlayModeGrid")} />,
      text: t("overlayModeGrid"),
      value: OverlayMode.GRID
    },{
      icon: <OverlayBorderIcon ariaLabel={t("overlayModeBorder")} />,
      text: t("overlayModeBorder"),
      value: OverlayMode.BORDER
    },{
      icon: <OverlayPaperIcon ariaLabel={t("overlayModePaper")} />,
      text: t("overlayModePaper"),
      value: OverlayMode.PAPER
    },

  ];

  return (
    <>
      <header
        className={`bg-white dark:bg-black absolute left-0 w-full z-30 border-b-2 dark:border-gray-700 transition-all duration-700 h-16 flex items-center ${showNav ? "top-0" : "-top-20"}`}
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
              className={`!p-1 border-2 border-black dark:border-white`}
              onClick={() => setShowNav(false)}
            >
              <ExpandLessIcon ariaLabel={t("menuHide")} />
            </IconButton>
            <div className="relative inline-block text-left">
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
            </div>
          </div>
          <div className={`flex items-center gap-2 ${visible(isCalibrating)}`}>
            <Tooltip
              description={
                displaySettings.isFourCorners
                  ? t("fourCornersOff")
                  : t("fourCornersOn")
              }
            >
              <IconButton
                onClick={() =>
                  setDisplaySettings({
                    ...displaySettings,
                    isFourCorners: !displaySettings.isFourCorners,
                  })
                }
              >
                {displaySettings.isFourCorners ? (
                  <FourCorners ariaLabel={t("fourCornersOn")} />
                ) : (
                  <FourCornersOff ariaLabel={t("fourCornersOff")} />
                )}
              </IconButton>
            </Tooltip>

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
                showStitchMenu ? t("stitchMenuHide") : t("stitchMenuShow")
              }
              className={`${visible(pageCount > 1)}`}
            >
              <IconButton onClick={() => setShowStitchMenu(!showStitchMenu)}>
                <FlexWrapIcon
                  ariaLabel={
                    showStitchMenu ? t("stitchMenuHide") : t("stitchMenuShow")
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
            <DropdownIconButton
              selection={displaySettings.overlayMode}
              setSelection={(newOverlayMode)=>{
                setDisplaySettings({
                  ...displaySettings,
                  overlayMode: newOverlayMode,
                });
              }}
              description={t("overlayMode")}
              options={overlayOptions}
            />

            <Tooltip description={t("flipHorizontal")}>
              <IconButton
                onClick={() =>
                  setTransformSettings({
                    ...transformSettings,
                    matrix: flipMatrixHorizontally(transformSettings.matrix),
                  })
                }
              >
                <FlipVerticalIcon ariaLabel={t("flipHorizontal")} />
              </IconButton>
            </Tooltip>
            <Tooltip description={t("flipVertical")}>
              <IconButton
                onClick={() =>
                  setTransformSettings({
                    ...transformSettings,
                    matrix: flipMatrixVertically(transformSettings.matrix),
                  })
                }
              >
                <FlipHorizontalIcon ariaLabel={t("flipVertical")} />
              </IconButton>
            </Tooltip>
            <Tooltip description={t("rotate90")}>
              <IconButton
                onClick={() =>
                  setTransformSettings({
                    ...transformSettings,
                    matrix: rotateMatrixDeg(transformSettings.matrix, 90),
                  })
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
      {!showNav ? (
        <IconButton
          className={`!p-1 border-2 border-black dark:border-white absolute top-2 z-40 left-1/4 focus:ring-0`}
          onClick={() => setShowNav(true)}
        >
          <ExpandMoreIcon ariaLabel={t("menuShow")} />
        </IconButton>
      ) : null}
    </>
  );
}
