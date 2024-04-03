import { Direction } from "@/_lib/direction";
import { useTranslations } from "next-intl";
import React from "react";
import { IconButton } from "./buttons/icon-button";
import KeyboardArrowUpIcon from "@/_icons/keyboard-arrow-up";
import KeyboardArrowDownIcon from "@/_icons/keyboard-arrow-down";
import KeyboardArrowLeftIcon from "@/_icons/keyboard-arrow-left";
import KeyboardArrowRightIcon from "@/_icons/keyboard-arrow-right";
import { Point, applyOffset } from "@/_lib/point";
import StepIcon from "@/_icons/step-icon";

export default function MovementPad({
  corners,
  setCorners,
  points,
  setPoints,
}: {
  corners: Set<number>;
  setCorners: (corners: Set<number>) => void;
  points: Point[];
  setPoints: (points: Point[]) => void;
}) {
  const t = useTranslations("MovementPad");
  const border = "border-2 border-purple-600";

  function handleMove(direction: Direction) {
    if (corners.size) {
      const newPoints = [...points];
      for (const pointToModify of corners) {
        let newPoint = points[pointToModify];
        const px = 1;
        switch (direction) {
          case Direction.Up:
            newPoint = applyOffset(newPoint, { y: -px, x: 0 });
            break;
          case Direction.Down:
            newPoint = applyOffset(newPoint, { y: px, x: 0 });
            break;
          case Direction.Left:
            newPoint = applyOffset(newPoint, { y: 0, x: -px });
            break;
          case Direction.Right:
            newPoint = applyOffset(newPoint, { y: 0, x: px });
            break;
          default:
            break;
        }
        newPoints[pointToModify] = newPoint;
      }
      setPoints(newPoints);
    }
  }

  function handleChangeCorners() {
    const newCorners = new Set<number>();
    corners.forEach((c) => {
      newCorners.add((c + 1) % points.length);
    });
    setCorners(newCorners);
  }

  return (
    <div className="absolute top-1/2 left-1/2 z-50">
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
