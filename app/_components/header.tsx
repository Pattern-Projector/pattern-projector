import { useTranslations } from "next-intl";
import Link from "next/link";
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
import ArrowBackIcon from "@/_icons/arrow-back-icon";
import ArrowForwardIcon from "@/_icons/arrow-forward-icon";
import DeleteIcon from "@/_icons/delete-icon";
import FlipHorizontalIcon from "@/_icons/flip-horizontal-icon";
import FlipHorizontalOffIcon from "@/_icons/flip-horizontal-off-icon";
import FlipVerticalIcon from "@/_icons/flip-vertical-icon";
import FlipVerticalOffIcon from "@/_icons/flip-vertical-off-icon";
import GridOffIcon from "@/_icons/grid-off-icon";
import GridOnIcon from "@/_icons/grid-on-icon";
import InfoIcon from "@/_icons/info-icon";
import InvertColorIcon from "@/_icons/invert-color-icon";
import InvertColorOffIcon from "@/_icons/invert-color-off-icon";
import PdfIcon from "@/_icons/pdf-icon";
import Rotate90DegreesCWIcon from "@/_icons/rotate-90-degrees-cw-icon";
import { TransformSettings } from "@/_lib/transform-settings";
import { CM, IN } from "@/_lib/unit";
import LayersIcon from "@/_icons/layers-icon";
import LayersOffIcon from "@/_icons/layers-off-icon";
import RecenterIcon from "@/_icons/recenter-icon";
import Matrix from "ml-matrix";
import { translate } from "@/_lib/geometry";
import FourCorners from "@/_icons/four-corners";
import FourCornersOff from "@/_icons/four-corners-off";
import { visible } from "@/_components/theme/css-functions";
import { IconButton } from "@/_components/buttons/icon-button";
import Tooltip from "@/_components/tooltip/tooltip";
import { Layer } from "@/_lib/layer";
import FullscreenExitIcon from "@/_icons/fullscreen-exit-icon";
import ExpandLessIcon from "@/_icons/expand-less-icon";
import ExpandMoreIcon from "@/_icons/expand-more-icon";

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
  pageNumber,
  setPageNumber,
  pageCount,
  gridOn,
  setGridOn,
  layers,
  showLayerMenu,
  setShowLayerMenu,
  localTransform,
  calibrationTransform,
  setLocalTransform,
  pageWidth,
  pageHeight,
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
  setTransformSettings: (newTransformSettings: TransformSettings) => void;
  pageNumber: number;
  setPageNumber: Dispatch<SetStateAction<number>>;
  pageCount: number;
  gridOn: boolean;
  setGridOn: Dispatch<SetStateAction<boolean>>;
  layers: Map<string, Layer>;
  showLayerMenu: boolean;
  setShowLayerMenu: Dispatch<SetStateAction<boolean>>;
  localTransform: Matrix;
  calibrationTransform: Matrix;
  setLocalTransform: Dispatch<SetStateAction<Matrix>>;
  pageWidth: number;
  pageHeight: number;
}) {
  const t = useTranslations("Header");

  const [invertOpen, setInvertOpen] = useState<boolean>(false);
  const [showNav, setShowNav] = useState<boolean>(true);

  function changePage(offset: number) {
    setPageNumber((prevPageNumber: number) => prevPageNumber + offset);
  }

  function handlePreviousPage() {
    changePage(-1);
  }

  function handleNextPage() {
    changePage(1);
  }

  function handleRecenter() {
    if (localTransform !== null) {
      const pdfPixels = 72;
      const tx = (+width * pdfPixels) / 2 - pageWidth / 2;
      const ty = (+height * pdfPixels) / 2 - pageHeight / 2;
      const m = translate({ x: tx, y: ty });
      setLocalTransform(calibrationTransform.mmul(m));
    }
  }

  useEffect(() => {
    if (isCalibrating) {
      setShowLayerMenu(false);
    }
  }, [isCalibrating, setShowLayerMenu]);

  useEffect(() => {
    if (fullScreenHandle.active) {
      setShowNav(false);
    } else {
      setShowNav(true);
    }
  }, [fullScreenHandle.active]);

  return (
    <>
      <header
        className={`bg-white absolute left-0 w-full z-30 border-b-2 transition-all duration-700 h-16 flex items-center ${showNav ? "top-0" : "-top-20"}`}
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
          </div>
          <div className={`flex items-center gap-2 ${visible(isCalibrating)}`}>
            <Tooltip
              description={
                transformSettings.isFourCorners
                  ? t("fourCornersOff")
                  : t("fourCornersOn")
              }
            >
              <IconButton
                onClick={() =>
                  setTransformSettings({
                    ...transformSettings,
                    isFourCorners: !transformSettings.isFourCorners,
                  })
                }
              >
                {transformSettings.isFourCorners ? (
                  <FourCorners ariaLabel={t("fourCornersOn")} />
                ) : (
                  <FourCornersOff ariaLabel={t("fourCornersOff")} />
                )}
              </IconButton>
            </Tooltip>

            <div className="flex gap-1">
              <InlineInput
                handleChange={handleHeightChange}
                id="height"
                label={t("height")}
                labelRight={unitOfMeasure === CM ? "cm" : "in"}
                name="height"
                value={height}
              />
              <InlineInput
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
              description={showLayerMenu ? t("layersOff") : t("layersOn")}
            >
              <IconButton
                disabled={!layers || layers.size === 0}
                onClick={() => setShowLayerMenu(!showLayerMenu)}
              >
                {showLayerMenu ? (
                  <LayersIcon ariaLabel={t("layersOn")} />
                ) : (
                  <LayersOffIcon ariaLabel={t("layersOff")} />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip description={gridOn ? t("gridOff") : t("gridOn")}>
              <IconButton onClick={() => setGridOn(!gridOn)}>
                {gridOn ? (
                  <GridOnIcon ariaLabel={t("gridOn")} />
                ) : (
                  <GridOffIcon ariaLabel={t("gridOff")} />
                )}
              </IconButton>
            </Tooltip>
            <div className="relative inline-block text-left">
              <Tooltip description={t("invertColor")}>
                <IconButton
                  onClick={(e) => {
                    let newInverted;
                    let newIsGreenInverted;
                    if (!transformSettings.inverted) {
                      newInverted = true;
                      newIsGreenInverted = false;
                    } else if (!transformSettings.isInvertedGreen) {
                      newInverted = true;
                      newIsGreenInverted = true;
                    } else {
                      newInverted = false;
                      newIsGreenInverted = false;
                    }
                    setTransformSettings({
                      ...transformSettings,
                      inverted: newInverted,
                      isInvertedGreen: newIsGreenInverted,
                    });
                    setInvertOpen(!transformSettings.inverted);
                  }}
                >
                  {transformSettings.inverted ? (
                    <InvertColorIcon
                      fill={
                        transformSettings.isInvertedGreen ? "#32CD32" : "#000"
                      }
                      ariaLabel={t("invertColor")}
                    />
                  ) : (
                    <InvertColorOffIcon ariaLabel={t("invertColorOff")} />
                  )}
                </IconButton>
              </Tooltip>
            </div>
            <Tooltip description={t("flipHorizontal")}>
              <IconButton
                onClick={() =>
                  setTransformSettings({
                    ...transformSettings,
                    scale: {
                      x: transformSettings.scale.x * -1,
                      y: transformSettings.scale.y,
                    },
                  })
                }
              >
                {transformSettings.scale.x === -1 ? (
                  <FlipVerticalOffIcon ariaLabel={t("flipHorizontal")} />
                ) : (
                  <FlipVerticalIcon ariaLabel={t("flipHorizontalOff")} />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip description={t("flipVertical")}>
              <IconButton
                onClick={() =>
                  setTransformSettings({
                    ...transformSettings,
                    scale: {
                      x: transformSettings.scale.x,
                      y: transformSettings.scale.y * -1,
                    },
                  })
                }
              >
                {transformSettings.scale.y === -1 ? (
                  <FlipHorizontalOffIcon ariaLabel={t("flipVertical")} />
                ) : (
                  <FlipHorizontalIcon ariaLabel={t("flipVerticalOff")} />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip description={t("rotate90")}>
              <IconButton
                onClick={() =>
                  setTransformSettings({
                    ...transformSettings,
                    degrees: (transformSettings.degrees + 90) % 360,
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
            <div className={`flex items-center ${visible(pageCount > 1)}`}>
              <IconButton
                disabled={pageNumber <= 1}
                onClick={handlePreviousPage}
              >
                <ArrowBackIcon ariaLabel={t("arrowBack")} />
              </IconButton>
              <span className="mx-1">{pageNumber}</span>
              <IconButton
                disabled={pageNumber >= pageCount}
                onClick={handleNextPage}
              >
                <ArrowForwardIcon ariaLabel={t("arrowForward")} />
              </IconButton>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label
              className={`${visible(
                !isCalibrating,
              )} outline outline-purple-700 flex gap-2 items-center text-purple-800 focus:ring-2 focus:outline-none focus:ring-blue-300 hover:bg-purple-100 font-medium rounded-lg text-sm px-2 py-1.5 hover:bg-none text-center`}
            >
              <FileInput
                accept="application/pdf"
                className="hidden"
                handleChange={handleFileChange}
                id="pdfFile"
              ></FileInput>
              <PdfIcon ariaLabel={t("openPDF")} fill="#7e22ce" />
              {t("openPDF")}
            </label>
            <button
              className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
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
        {fullScreenHandle.active ? (
          <IconButton
            className={`mt-1 px-1 py-1 border-2 border-slate-400 absolute ${showNav ? "top-14" : "top-20"} z-40 left-1/2 transition-all duration-700 focus:ring-0`}
            onClick={() => setShowNav(!showNav)}
          >
            {showNav ? (
              <ExpandLessIcon ariaLabel={t("menuHide")} />
            ) : (
              <ExpandMoreIcon ariaLabel={t("menuShow")} />
            )}
          </IconButton>
        ) : null}
      </header>
    </>
  );
}
