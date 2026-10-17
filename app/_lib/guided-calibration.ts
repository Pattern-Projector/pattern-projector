import { Point } from "@/_lib/point";
import { Unit } from "@/_lib/unit";

/**
 * Guided calibration: rough alignment against a printed target, then lens correction, then corner fine-tuning.
 *
 * During rough alignment the calibration grid is kept rectangular and placed on screen with a similarity transform:
 * the centre of the grid goes to `center`, one grid unit is `scale` pixels long and the grid is turned by
 * `rotation` radians. Moving, resizing and rotating the projected target changes only these three values.
 */
export interface Placement {
  center: Point;
  scale: number;
  rotation: number;
}

export enum GuideStep {
  Print = "print",
  Align = "align",
  Lens = "lens",
  Corners = "corners",
}

// Lens correction comes last and keeps the corners where they are, so the steps never undo each other
export const guideSteps = [
  GuideStep.Print,
  GuideStep.Align,
  GuideStep.Corners,
  GuideStep.Lens,
];

/** Size of the box on the printable target. It fits on both letter and A4 paper. */
export const targetBoxInches = { width: 8, height: 6 };

export const targetFileName = "/calibration-target.pdf";

/** Size of the printed target box in the calibration's unit of measure. */
export function targetBoxSize(unitOfMeasure: Unit) {
  const f = unitOfMeasure === Unit.CM ? 2.54 : 1;
  return {
    width: targetBoxInches.width * f,
    height: targetBoxInches.height * f,
  };
}

/** Screen corners of a width x height grid, clockwise from the top left like the calibration points. */
export function pointsFromPlacement(
  placement: Placement,
  width: number,
  height: number,
): Point[] {
  const { center, scale, rotation } = placement;
  const cos = Math.cos(rotation) * scale;
  const sin = Math.sin(rotation) * scale;
  return [
    { x: -width / 2, y: -height / 2 },
    { x: width / 2, y: -height / 2 },
    { x: width / 2, y: height / 2 },
    { x: -width / 2, y: height / 2 },
  ].map((p) => ({
    x: center.x + p.x * cos - p.y * sin,
    y: center.y + p.x * sin + p.y * cos,
  }));
}

/**
 * The closest placement to existing calibration points, so rough alignment starts from the current calibration.
 */
export function placementFromPoints(
  points: Point[],
  width: number,
  height: number,
): Placement {
  const center = {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
  };
  // Average the top and bottom edges for the direction and all four edges for the size
  const top = { x: points[1].x - points[0].x, y: points[1].y - points[0].y };
  const bottom = {
    x: points[2].x - points[3].x,
    y: points[2].y - points[3].y,
  };
  const left = { x: points[3].x - points[0].x, y: points[3].y - points[0].y };
  const right = { x: points[2].x - points[1].x, y: points[2].y - points[1].y };
  const rotation = Math.atan2(top.y + bottom.y, top.x + bottom.x);
  const horizontal =
    (Math.hypot(top.x, top.y) + Math.hypot(bottom.x, bottom.y)) / 2;
  const vertical =
    (Math.hypot(left.x, left.y) + Math.hypot(right.x, right.y)) / 2;
  const scale = (horizontal / width + vertical / height) / 2;
  return { center, scale, rotation };
}

/** A placement that fits the whole grid comfortably on a screen of the given size. */
export function defaultPlacement(
  screenWidth: number,
  screenHeight: number,
  width: number,
  height: number,
): Placement {
  const scale = 0.6 * Math.min(screenWidth / width, screenHeight / height);
  return {
    center: { x: screenWidth / 2, y: screenHeight / 2 },
    scale,
    rotation: 0,
  };
}

export const minPlacementScale = 1;

/** Resizes the grid around its centre. */
export function scalePlacement(
  placement: Placement,
  factor: number,
): Placement {
  return {
    ...placement,
    scale: Math.max(minPlacementScale, placement.scale * factor),
  };
}

export function rotatePlacement(
  placement: Placement,
  radians: number,
): Placement {
  return { ...placement, rotation: placement.rotation + radians };
}

export function movePlacement(placement: Placement, offset: Point): Placement {
  return {
    ...placement,
    center: {
      x: placement.center.x + offset.x,
      y: placement.center.y + offset.y,
    },
  };
}

/** Where to start the guide: from the beginning for a new user, otherwise closed. */
export function initialGuideStep(
  hasSavedCalibration: boolean,
): GuideStep | null {
  return hasSavedCalibration ? null : GuideStep.Print;
}

export function nextGuideStep(step: GuideStep): GuideStep | null {
  const i = guideSteps.indexOf(step);
  return i < guideSteps.length - 1 ? guideSteps[i + 1] : null;
}

export function previousGuideStep(step: GuideStep): GuideStep {
  const i = guideSteps.indexOf(step);
  return guideSteps[Math.max(0, i - 1)];
}
