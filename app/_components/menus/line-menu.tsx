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
import { Dispatch, SetStateAction } from "react";
import { Point } from "@/_lib/point";
import FlipHorizontalIcon from "@/_icons/flip-horizontal-icon";
import KeyboardArrowLeftIcon from "@/_icons/keyboard-arrow-left";
import ShiftIcon from "@/_icons/shift-icon";
import { subtract } from "@/_lib/point";
import { MenuStates, sideMenuOpen } from "@/_lib/menu-states";
import removeNonDigits from "@/_lib/remove-non-digits";
import { Unit } from "@/_lib/unit";
import {
  Line,
  LinesAction,
  createLine,
  transformLine,
} from "@/_reducers/linesReducer";
import InlineInput from "@/_components/inline-input";

export default function LineMenu({
  selectedLine,
  setSelectedLine,
  lines,
  handleDeleteLine,
  gridCenter,
  setMeasuring,
  menusHidden,
  menuStates,
  unitOfMeasure,
  dispatchLines,
}: {
  selectedLine: number;
  setSelectedLine: Dispatch<SetStateAction<number>>;
  lines: Line[];
  handleDeleteLine: () => void;
  gridCenter: Point;
  setMeasuring: Dispatch<SetStateAction<boolean>>;
  menusHidden: boolean;
  menuStates: MenuStates;
  unitOfMeasure: Unit;
  dispatchLines: Dispatch<LinesAction>;
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

  const grainLine = createLine(
    gridCenter,
    {
      x: gridCenter.x + 1,
      y: gridCenter.y,
    },
    unitOfMeasure,
  );

  return (
    selected && (
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
              transformer.translate(
                subtract(matLine.points[1], matLine.points[0]),
              );
              if (selected) {
                dispatchLines({
                  type: "update-both-points",
                  index: selectedLine,
                  newP0: selected.points[1],
                  newP1: selected.points[0],
                });
              }
            }
          }}
        />
        <InlineInput
          className="relative flex flex-col w-20"
          inputClassName="pl-1.5 pr-7 !border-2 !border-black dark:!border-white"
          handleChange={(e) => {
            const newDistance = removeNonDigits(
              e.target.value,
              selected.distance,
            );
            dispatchLines({
              type: "update-distance",
              index: selectedLine,
              newDistance,
            });
          }}
          id="distance"
          labelRight={unitOfMeasure.toLocaleLowerCase()}
          name="distance"
          value={selected.distance}
          type="string"
        />
        <InlineInput
          className="relative flex flex-col w-14"
          inputClassName="pl-1.5 !border-2 !border-black dark:!border-white"
          handleChange={(e) => {
            const inputValue = e.target.value;
            let newAngle;

            if (inputValue === "") {
              newAngle = "";
            } else {
              const numValue = parseInt(inputValue);
              if (!isNaN(numValue) && numValue >= 0 && numValue <= 360) {
                newAngle = String(numValue);
              } else {
                return;
              }
            }
            dispatchLines({
              type: "update-angle",
              index: selectedLine,
              newAngle,
            });
          }}
          id="angle"
          labelRight="°"
          name="angle"
          value={selected.angle}
          type="string"
        />
      </menu>
    )
  );
}
