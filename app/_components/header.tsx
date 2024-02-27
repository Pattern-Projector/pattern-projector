import { useTranslations } from "next-intl";
import Link from "next/link";
import { ChangeEvent, Dispatch, SetStateAction, useState } from "react";
import { FullScreenHandle } from "react-full-screen";

import { Dropdown } from "@/_components/dropdown/dropdown";
import FileInput from "@/_components/file-input";
import FullScreenButton from "@/_components/full-screen-button";
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

function visible(b: boolean): string {
  return b ? "visible" : "hidden";
}
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
}) {
  const t = useTranslations("Header");

  const [invertOpen, setInvertOpen] = useState<boolean>(false);

  function changePage(offset: number) {
    setPageNumber((prevPageNumber: number) => prevPageNumber + offset);
  }

  function handlePreviousPage() {
    changePage(-1);
  }

  function handleNextPage() {
    changePage(1);
  }

  return (
    <header className="bg-white absolute top-0 left-0 w-full z-30 border-b-2">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between p-2 lg:px-8"
        aria-label="Global"
      >
        <div className="flex items-center">
          <h1 className="mr-2">
            {isCalibrating ? t("calibrating") : t("projecting")}
          </h1>
          <FullScreenButton
            className={`bg-white z-20 cursor-pointer from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-full p-2.5`}
            handle={fullScreenHandle}
          />
        </div>
        <div className={`flex items-center ${visible(isCalibrating)}`}>
          <button
            className={`bg-white cursor-pointer from-purple-600 to-blue-500 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-full p-2.5 mr-2`}
            name={"Flip horizontally"}
            onClick={() =>
              setTransformSettings({
                ...transformSettings,
                isFourCorners: !transformSettings.isFourCorners,
              })
            }
          >
            {transformSettings.isFourCorners ? (
              <FlipHorizontalOffIcon ariaLabel={t("flipHorizontalOff")} />
            ) : (
              <FlipHorizontalIcon ariaLabel={t("flipHorizontal")} />
            )}
          </button>
          <InlineInput
            className="mr-1"
            handleChange={handleHeightChange}
            id="height"
            inputTestId="height"
            label={t("height")}
            labelRight={unitOfMeasure === CM ? "cm" : "in"}
            name="height"
            value={height}
          />
          <InlineInput
            className="mr-1"
            handleChange={handleWidthChange}
            id="height"
            inputTestId="height"
            label={t("width")}
            labelRight={unitOfMeasure === CM ? "cm" : "in"}
            name="width"
            value={width}
          />
          <InlineSelect
            className="mr-1"
            handleChange={(e) => setUnitOfMeasure(e.target.value)}
            id="unit_of_measure"
            inputTestId="unit_of_measure"
            name="unit_of_measure"
            value={unitOfMeasure}
            options={[
              { value: IN, label: "in" },
              { value: CM, label: "cm" },
            ]}
          />
          <button
            className={`bg-white cursor-pointer from-purple-600 to-blue-500 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-full p-2.5 ${visible(
              isCalibrating,
            )}`}
            name={"Delete points"}
            onClick={handleResetCalibration}
          >
            <DeleteIcon ariaLabel={t("delete")} />
          </button>
        </div>
        <div className={`flex items-center ${visible(!isCalibrating)}`}>
          <button
            className={`bg-white cursor-pointer from-purple-600 to-blue-500 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-full p-2.5 mr-2`}
            name={"Toggle grid visibility"}
            onClick={() => setGridOn(!gridOn)}
          >
            {gridOn ? (
              <GridOnIcon ariaLabel={t("gridOn")} />
            ) : (
              <GridOffIcon ariaLabel={t("gridOff")} />
            )}
          </button>
          <div className="relative inline-block text-left">
            <button
              className={`bg-white cursor-pointer from-purple-600 to-blue-500 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-full p-2.5 mr-2`}
              name={t("invertColor")}
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
                <InvertColorOffIcon
                  fill={transformSettings.isInvertedGreen ? "#32CD32" : "#000"}
                  ariaLabel={t("invertColorOff")}
                />
              ) : (
                <InvertColorIcon ariaLabel={t("invertColor")} />
              )}
            </button>
          </div>
          <button
            className={`bg-white cursor-pointer from-purple-600 to-blue-500 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-full p-2.5 mr-2`}
            name={"Flip vertically"}
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
              <FlipVerticalOffIcon ariaLabel={t("flipVerticalOff")} />
            ) : (
              <FlipVerticalIcon ariaLabel={t("flipVertical")} />
            )}
          </button>
          <button
            className={`bg-white cursor-pointer from-purple-600 to-blue-500 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-full p-2.5 mr-2`}
            name={"Flip horizontally"}
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
              <FlipHorizontalOffIcon ariaLabel={t("flipHorizontalOff")} />
            ) : (
              <FlipHorizontalIcon ariaLabel={t("flipHorizontal")} />
            )}
          </button>
          <button
            className={`bg-white cursor-pointer from-purple-600 to-blue-500 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-full p-2.5`}
            name={"Rotate 90 degrees clockwise"}
            onClick={() =>
              setTransformSettings({
                ...transformSettings,
                degrees: (transformSettings.degrees + 90) % 360,
              })
            }
          >
            <Rotate90DegreesCWIcon ariaLabel={t("rotate90")} />
          </button>
          <div className={`flex items-center ml-3 ${visible(pageCount > 1)}`}>
            <button
              disabled={pageNumber <= 1}
              onClick={handlePreviousPage}
              name="Previous Page"
            >
              <ArrowBackIcon ariaLabel={t("arrowBack")} />
            </button>
            {pageNumber}
            <button
              disabled={pageNumber >= pageCount}
              onClick={handleNextPage}
              name="Next Page"
            >
              <ArrowForwardIcon ariaLabel={t("arrowForward")} />
            </button>
          </div>
        </div>
        <div className="flex items-center">
          <label
            className={`${visible(
              !isCalibrating,
            )} outline mr-2 outline-purple-700 flex items-center text-purple-800 focus:ring-2 focus:outline-none focus:ring-blue-300 hover:bg-purple-100 font-medium rounded-lg text-sm px-2 py-1.5 hover:bg-none text-center`}
          >
            <FileInput
              accept="application/pdf"
              className="hidden"
              handleChange={handleFileChange}
              id="pdfFile"
            ></FileInput>
            <span className="mr-2">
              <PdfIcon ariaLabel={t("openPDF")} fill="#7e22ce" />
            </span>
            {t("openPDF")}
          </label>
          <button
            className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            onClick={() => setIsCalibrating(!isCalibrating)}
          >
            {isCalibrating ? t("project") : t("calibrate")}
          </button>
          <Link
            className={`ml-1 bg-white cursor-pointer from-purple-600 to-blue-500 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-full p-2.5`}
            href="/"
          >
            <InfoIcon ariaLabel={t("info")} />
          </Link>
        </div>
      </nav>
    </header>
  );
}
