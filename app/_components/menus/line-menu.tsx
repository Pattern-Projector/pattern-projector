import { useTranslations } from "next-intl";
import { IconButton } from "@/_components/buttons/icon-button";
import RotateToHorizontalIcon from "@/_icons/rotate-to-horizontal";
import { visible } from "@/_components/theme/css-functions";
import Tooltip from "@/_components/tooltip/tooltip";
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
import { subtract } from "@/_lib/point";
import { MenuStates, sideMenuOpen } from "@/_lib/menu-states";

export default function LineMenu({
  selectedLine,
  setSelectedLine,
  lines,
  setLines,
  handleDeleteLine,
  gridCenter,
  setMeasuring,
  menusHidden,
  menuStates,
}: {
  selectedLine: number;
  setSelectedLine: Dispatch<SetStateAction<number>>;
  lines: Line[];
  setLines: Dispatch<SetStateAction<Line[]>>;
  handleDeleteLine: () => void;
  gridCenter: Point;
  setMeasuring: Dispatch<SetStateAction<boolean>>;
  menusHidden: boolean;
  menuStates: MenuStates;
}) {
  const t = useTranslations("MeasureCanvas");
  const transformer = useTransformerContext();
  const transform = useTransformContext();

  const selected = selectedLine >= 0 ? lines[selectedLine] : undefined;
  const matLine = selectedLine >= 0 ? getMatLine(selectedLine) : undefined;

  function getMatLine(i: number): Line {
    return transformLine(lines[i], transform);
  }

  function Action({
    description,
    Icon,
    onClick,
  }: {
    description: string;
    Icon: (props: { ariaLabel: string }) => JSX.Element;
    onClick: () => void;
  }) {
    return (
      <Tooltip description={description}>
        <IconButton
          border={true}
          onClick={() => {
            onClick();
            setMeasuring(false);
          }}
        >
          <Icon ariaLabel={description} />
        </IconButton>
      </Tooltip>
    );
  }

  const grainLine: Line = [
    gridCenter,
    { x: gridCenter.x + 1, y: gridCenter.y },
  ];

  return (
    // center menu items horizontally
    <menu
      className={`absolute justify-center items-center ${sideMenuOpen(menuStates) ? "left-80" : "left-16"} top-16 flex gap-2 p-2 ${visible(selectedLine >= 0 && !menusHidden)}`}
    >
      <div className="flex flex-col items-center">
        <span>{lines.length}</span>
        <span>{lines.length === 1 ? t("line") : t("lines")}</span>
      </div>
      <Action
        description={t("deleteLine")}
        Icon={DeleteIcon}
        onClick={handleDeleteLine}
      />
      <Action
        description={t("rotateToHorizontal")}
        Icon={RotateToHorizontalIcon}
        onClick={() => {
          if (matLine) {
            transformer.align(matLine, grainLine);
          }
        }}
      />
      <Action
        description={t("rotateAndCenterPrevious")}
        Icon={KeyboardArrowLeftIcon}
        onClick={() => {
          if (lines.length > 0) {
            const previous =
              selectedLine <= 0 ? lines.length - 1 : selectedLine - 1;
            setSelectedLine(previous);
            transformer.align(getMatLine(previous), grainLine);
          }
        }}
      />
      <Action
        description={t("rotateAndCenterNext")}
        Icon={KeyboardArrowRightIcon}
        onClick={() => {
          if (lines.length > 0) {
            const next =
              selectedLine + 1 >= lines.length ? 0 : selectedLine + 1;
            setSelectedLine(next);
            transformer.align(getMatLine(next), grainLine);
          }
        }}
      />
      <Action
        description={t("flipAlong")}
        Icon={FlipHorizontalIcon}
        onClick={() => {
          if (matLine) {
            transformer.flipAlong(matLine);
          }
        }}
      />
      <Action
        description={t("translate")}
        Icon={ShiftIcon}
        onClick={() => {
          if (matLine) {
            transformer.translate(subtract(matLine[1], matLine[0]));
            if (selected) {
              const newLines = lines.slice();
              newLines[selectedLine] = [selected[1], selected[0]];
              setLines(newLines);
            }
          }
        }}
      />
    </menu>
  );
}
