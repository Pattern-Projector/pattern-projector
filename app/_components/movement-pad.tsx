import { Direction } from "@/_lib/direction";
import { useTranslations } from "next-intl";
import React, { Dispatch } from "react";
import { IconButton } from "./buttons/icon-button";
import KeyboardArrowUpIcon from "@/_icons/keyboard-arrow-up";
import KeyboardArrowDownIcon from "@/_icons/keyboard-arrow-down";
import KeyboardArrowLeftIcon from "@/_icons/keyboard-arrow-left";
import KeyboardArrowRightIcon from "@/_icons/keyboard-arrow-right";
import { Point } from "@/_lib/point";
import { PointAction } from "@/_reducers/pointsReducer";
import CycleIcon from "@/_icons/cycle-icon";
import { getCalibrationContextUpdatedWithEvent } from "@/_lib/calibration-context";
import { FullScreenHandle } from "react-full-screen";

const PIXEL_LIST = [1, 4, 8, 16];
const REPEAT_MS = 100;
const REPEAT_PX_COUNT = 6;

export default function MovementPad({
  corners,
  setCorners,
  dispatch,
  fullScreenHandle,
}: {
  corners: Set<number>;
  setCorners: (corners: Set<number>) => void;
  dispatch: Dispatch<PointAction>;
  fullScreenHandle: FullScreenHandle;
}) {
  const t = useTranslations("MovementPad");
  const border = "border-2 border-purple-600";
  const [intervalFunc, setIntervalFunc] = React.useState<NodeJS.Timeout | null>(
    null,
  );

  function getOffset(direction: Direction, px: number): Point {
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

  function handleMove(direction: Direction, px: number) {
    if (corners.size) {
      const offset = getOffset(direction, px);
      dispatch({ type: "offset", offset, corners });
    }
  }

  function handleStart(direction: Direction) {
    handleMove(direction, PIXEL_LIST[0]);
    let i = 0;
    setIntervalFunc(
      setInterval(() => {
        if (i < PIXEL_LIST.length * REPEAT_PX_COUNT - 1) {
          ++i;
        }
        handleMove(direction, PIXEL_LIST[Math.floor(i / REPEAT_PX_COUNT)]);
      }, REPEAT_MS),
    );
  }

  function handleStop(e: React.PointerEvent) {
    if (intervalFunc) {
      clearInterval(intervalFunc);
    }
    localStorage.setItem(
      "calibrationContext",
      JSON.stringify(
        getCalibrationContextUpdatedWithEvent(e, fullScreenHandle.active),
      ),
    );
  }

  function handleChangeCorners() {
    const newCorners = new Set<number>();
    corners.forEach((c) => {
      newCorners.add((c + 1) % 4);
    });
    setCorners(newCorners);
  }

  return (
    <div className="absolute top-[calc(50vh-80px)] right-8 z-50">
      <menu className={`grid grid-cols-3 gap-2`}>
        <IconButton
          style={{ WebkitUserSelect: "none", userSelect: "none" }}
          onPointerDown={() => handleStart(Direction.Up)}
          onPointerUp={(e) => handleStop(e)}
          className={`${border} col-start-2`}
        >
          <KeyboardArrowUpIcon ariaLabel={t("up")} />
        </IconButton>

        <IconButton
          style={{ WebkitUserSelect: "none", userSelect: "none" }}
          onPointerDown={() => handleStart(Direction.Left)}
          onPointerUp={(e) => handleStop(e)}
          className={`${border} col-start-1`}
        >
          <KeyboardArrowLeftIcon ariaLabel={t("left")} />
        </IconButton>

        <IconButton
          style={{ WebkitUserSelect: "none", userSelect: "none" }}
          onClick={handleChangeCorners}
          className={`${border} col-start-2`}
        >
          <CycleIcon ariaLabel={t("next")} />
        </IconButton>

        <IconButton
          style={{ WebkitUserSelect: "none", userSelect: "none" }}
          onPointerDown={() => handleStart(Direction.Right)}
          onPointerUp={(e) => handleStop(e)}
          className={`${border} col-start-3`}
        >
          <KeyboardArrowRightIcon ariaLabel={t("right")} />
        </IconButton>

        <IconButton
          style={{ WebkitUserSelect: "none", userSelect: "none" }}
          onPointerDown={() => handleStart(Direction.Down)}
          onPointerUp={(e) => handleStop(e)}
          className={`${border} col-start-2`}
        >
          <KeyboardArrowDownIcon ariaLabel={t("down")} />
        </IconButton>
      </menu>
    </div>
  );
}
