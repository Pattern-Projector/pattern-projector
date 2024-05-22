import { useTranslations } from "next-intl";
import { IconButton } from "./buttons/icon-button";
import RotateToHorizontalIcon from "@/_icons/rotate-to-horizontal";
import { visible } from "./theme/css-functions";
import Tooltip from "./tooltip/tooltip";
import FlipVerticalIcon from "@/_icons/flip-vertical-icon";
import KeyboardArrowRightIcon from "@/_icons/keyboard-arrow-right";
import DeleteIcon from "@/_icons/delete-icon";
import {
  useTransformContext,
  useTransformerContext,
} from "@/_hooks/use-transform-context";
import { transformLine } from "@/_lib/geometry";
import { Line } from "@/_lib/interfaces/line";
import { Dispatch, SetStateAction } from "react";

export default function LineMenu({
  selectedLine,
  lines,
  setLines,
  handleDeleteLine,
}: {
  selectedLine: number;
  lines: Line[];
  setLines: Dispatch<SetStateAction<Line[]>>;
  handleDeleteLine: () => void;
}) {
  const t = useTranslations("MeasureCanvas");
  const transformer = useTransformerContext();
  const transform = useTransformContext();

  const selected = lines.at(selectedLine);
  const opLine = selected ? transformLine(selected, transform) : null;
  const borderIconButton = "border-2 border-black dark:border-white";
  return (
    // center menu items horizontally
    <menu
      className={`absolute justify-center left-0 right-0 bottom-0 flex gap-2 p-2 ${visible(selectedLine >= 0)}`}
    >
      <Tooltip description={t("rotateToHorizontal")} top={true}>
        <IconButton
          className={borderIconButton}
          onClick={() => {
            if (opLine) {
              transformer.rotateToHorizontal(opLine);
            }
          }}
        >
          <RotateToHorizontalIcon ariaLabel={t("rotateToHorizontal")} />
        </IconButton>
      </Tooltip>
      <Tooltip description={t("flipAlong")} top={true}>
        <IconButton
          className={borderIconButton}
          onClick={() => {
            if (opLine) {
              transformer.flipAlong(opLine);
            }
          }}
        >
          <FlipVerticalIcon ariaLabel={t("flipAlong")} />
        </IconButton>
      </Tooltip>
      <Tooltip description={t("translate")} top={true}>
        <IconButton
          className={borderIconButton}
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
          }}
        >
          <KeyboardArrowRightIcon ariaLabel={t("translate")} />
        </IconButton>
      </Tooltip>
      <Tooltip description={t("deleteLine")} top={true}>
        <IconButton className={borderIconButton} onClick={handleDeleteLine}>
          <DeleteIcon ariaLabel={t("deleteLine")} />
        </IconButton>
      </Tooltip>
    </menu>
  );
}
