import { useTranslations } from "next-intl";
import { IconButton } from "./buttons/icon-button";
import RotateToHorizontalIcon from "@/_icons/rotate-to-horizontal";
import { visible } from "./theme/css-functions";
import Tooltip from "./tooltip/tooltip";
import KeyboardArrowRightIcon from "@/_icons/keyboard-arrow-right";
import DeleteIcon from "@/_icons/delete-icon";
import {
  useTransformContext,
  useTransformerContext,
} from "@/_hooks/use-transform-context";
import { transformLine } from "@/_lib/geometry";
import { Line } from "@/_lib/interfaces/line";
import { Dispatch, SetStateAction } from "react";
import { Point } from "@/_lib/point";
import FlipHorizontalIcon from "@/_icons/flip-horizontal-icon";
import KeyboardArrowLeftIcon from "@/_icons/keyboard-arrow-left";
import ShiftIcon from "@/_icons/shift-icon";

export default function LineMenu({
  selectedLine,
  setSelectedLine,
  lines,
  setLines,
  handleDeleteLine,
  gridCenter,
  setMeasuring,
}: {
  selectedLine: number;
  setSelectedLine: Dispatch<SetStateAction<number>>;
  lines: Line[];
  setLines: Dispatch<SetStateAction<Line[]>>;
  handleDeleteLine: () => void;
  gridCenter: Point;
  setMeasuring: Dispatch<SetStateAction<boolean>>;
}) {
  const t = useTranslations("MeasureCanvas");
  const transformer = useTransformerContext();
  const transform = useTransformContext();

  const selected = lines.at(selectedLine);
  const opLine = selected ? transformLine(selected, transform) : null;
  return (
    // center menu items horizontally
    <menu
      className={`absolute justify-center items-center left-0 right-0 bottom-0 flex gap-2 p-2 ${visible(selectedLine >= 0)}`}
    >
      <div className="flex flex-col items-center">
        <span>{lines.length}</span>
        <span>{lines.length === 1 ? t("line") : t("lines")}</span>
      </div>
      <Tooltip description={t("deleteLine")} top={true}>
        <IconButton
          border={true}
          onClick={() => {
            handleDeleteLine();
            setMeasuring(false);
          }}
        >
          <DeleteIcon ariaLabel={t("deleteLine")} />
        </IconButton>
      </Tooltip>

      <Tooltip description={t("rotateToHorizontal")} top={true}>
        <IconButton
          border={true}
          onClick={() => {
            if (opLine) {
              transformer.alignToCenter(gridCenter, opLine);
            }
            setMeasuring(false);
          }}
        >
          <RotateToHorizontalIcon ariaLabel={t("rotateToHorizontal")} />
        </IconButton>
      </Tooltip>

      <Tooltip description={t("rotateAndCenterPrevious")} top={true}>
        <IconButton
          border={true}
          onClick={() => {
            if (lines.length > 0) {
              const prevLine =
                selectedLine <= 0 ? lines.length - 1 : selectedLine - 1;
              setSelectedLine(prevLine);
              const prev = lines[prevLine];
              const opPrev = transformLine(prev, transform);
              transformer.alignToCenter(gridCenter, opPrev);
              setMeasuring(false);
            }
          }}
        >
          <KeyboardArrowLeftIcon ariaLabel={t("rotateToHorizontal")} />
        </IconButton>
      </Tooltip>

      <Tooltip description={t("rotateAndCenterNext")} top={true}>
        <IconButton
          border={true}
          onClick={() => {
            if (lines.length > 0) {
              const nextLine =
                selectedLine + 1 >= lines.length ? 0 : selectedLine + 1;
              setSelectedLine(nextLine);
              const prev = lines[nextLine];
              const opPrev = transformLine(prev, transform);
              transformer.alignToCenter(gridCenter, opPrev);
              setMeasuring(false);
            }
          }}
        >
          <KeyboardArrowRightIcon ariaLabel={t("rotateToHorizontal")} />
        </IconButton>
      </Tooltip>

      <Tooltip description={t("flipAlong")} top={true}>
        <IconButton
          border={true}
          onClick={() => {
            if (opLine) {
              transformer.flipAlong(opLine);
            }
            setMeasuring(false);
          }}
        >
          <FlipHorizontalIcon ariaLabel={t("flipAlong")} />
        </IconButton>
      </Tooltip>

      <Tooltip description={t("translate")} top={true}>
        <IconButton
          border={true}
          onClick={() => {
            if (opLine) {
              const p = {
                x: opLine[1].x - opLine[0].x,
                y: opLine[1].y - opLine[0].y,
              };
              transformer.translate(p);
              if (selected) {
                const newLines = lines.slice();
                newLines[selectedLine] = [selected[1], selected[0]];
                setLines(newLines);
              }
            }
            setMeasuring(false);
          }}
        >
          <ShiftIcon ariaLabel={t("translate")} />
        </IconButton>
      </Tooltip>
    </menu>
  );
}
