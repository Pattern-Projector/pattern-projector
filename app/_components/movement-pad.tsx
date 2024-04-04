import { Direction } from "@/_lib/direction";
import { useTranslations } from "next-intl";
import React, { Dispatch } from "react";
import { IconButton } from "./buttons/icon-button";
import KeyboardArrowUpIcon from "@/_icons/keyboard-arrow-up";
import KeyboardArrowDownIcon from "@/_icons/keyboard-arrow-down";
import KeyboardArrowLeftIcon from "@/_icons/keyboard-arrow-left";
import KeyboardArrowRightIcon from "@/_icons/keyboard-arrow-right";
import { Point } from "@/_lib/point";
import StepIcon from "@/_icons/step-icon";
import { PointAction } from "@/_reducers/pointsReducer";

export default function MovementPad({
  corners,
  setCorners,
  dispatch,
}: {
  corners: Set<number>;
  setCorners: (corners: Set<number>) => void;
  dispatch: Dispatch<PointAction>;
}) {
  const t = useTranslations("MovementPad");
  const border = "border-2 border-purple-600";

  function getOffset(direction: Direction): Point {
    const px = 1;
    switch (direction) {
      case Direction.Up:
        return { y: -px, x: 0 };
      case Direction.Down:
        return { y: px, x: 0 };
      case Direction.Left:
        return { y: 0, x: -px };
      case Direction.Right:
        return { y: 0, x: px };
      default:
        return { x: 0, y: 0 };
    }
  }

  function handleMove(direction: Direction) {
    if (corners.size) {
      let offset = getOffset(direction);
      dispatch({ type: "offset", offset, corners });
    }
  }

  function handleChangeCorners() {
    const newCorners = new Set<number>();
    corners.forEach((c) => {
      newCorners.add((c + 1) % 4);
    });
    setCorners(newCorners);
  }

  return (
    <div className="absolute top-[calc(50vh-80px)] right-0 z-50">
      <menu className={`grid grid-cols-3 gap-2`}>
        <IconButton
          onClick={() => handleMove(Direction.Up)}
          className={`${border} col-start-2`}
        >
          <KeyboardArrowUpIcon ariaLabel={t("up")} />
        </IconButton>

        <IconButton
          onClick={() => handleMove(Direction.Left)}
          className={`${border} col-start-1`}
        >
          <KeyboardArrowLeftIcon ariaLabel={t("left")} />
        </IconButton>

        <IconButton
          onClick={handleChangeCorners}
          className={`${border} col-start-2`}
        >
          <StepIcon ariaLabel={t("next")} />
        </IconButton>

        <IconButton
          onClick={() => handleMove(Direction.Right)}
          className={`${border} col-start-3`}
        >
          <KeyboardArrowRightIcon ariaLabel={t("right")} />
        </IconButton>

        <IconButton
          onClick={() => handleMove(Direction.Down)}
          className={`${border} col-start-2`}
        >
          <KeyboardArrowDownIcon ariaLabel={t("down")} />
        </IconButton>
      </menu>
    </div>
  );
}
