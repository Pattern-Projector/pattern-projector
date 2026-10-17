import { Unit } from "@/_lib/unit";
import { Point } from "@/_lib/point";
import {
  SimpleLine,
  angleDeg,
  dist,
  transformSimpleLine,
} from "@/_lib/geometry";
import { CSS_PIXELS_PER_INCH } from "@/_lib/pixels-per-inch";
import Matrix from "ml-matrix";

export interface Line {
  points: SimpleLine;
  distance: string; // controlled input for distance
  angle: string; // controlled input for angle
  unitOfMeasure: Unit; // unit of measure for distance
}

export function createLine(
  p0: Point,
  p1: Point,
  unitOfMeasure = Unit.IN,
): Line {
  const line: Line = {
    points: [p0, p1],
    distance: "0",
    angle: "0",
    unitOfMeasure,
  };
  return updateLineMeasurements(line);
}

export function transformLine(line: Line, m: Matrix): Line {
  const newLine = {
    ...line,
    points: transformSimpleLine(line.points, m),
  };
  return updateLineMeasurements(newLine);
}

export function calculateDistance(line: Line): number {
  let d = dist(...line.points) / CSS_PIXELS_PER_INCH;
  if (line.unitOfMeasure === Unit.CM) {
    d *= 2.54;
  }
  return d;
}

// Recalculates the distance and angle based on the line's points.
export function updateLineMeasurements(
  line: Line,
  isConstrained = false,
): Line {
  // Apply a fixed precision of 3 decimal places to the distance.
  const distance = calculateDistance(line).toFixed(3);

  // To match a standard y-up system, we flip the y-axis for the angle calculation.
  const dx = line.points[1].x - line.points[0].x;
  const dy = line.points[1].y - line.points[0].y;
  let a = (Math.atan2(-dy, dx) * 180) / Math.PI;

  if (a < 0) a += 360;

  let angle = a.toFixed(0);

  if (isConstrained) {
    angle = (Math.round(a / 45) * 45).toFixed(0);
  }
  if (angle === "360") angle = "0";
  return { ...line, distance, angle };
}

// Calculates a point based on a starting point, distance, and angle.
// This function assumes CCW angle (0 right, 90 up) and corrects for screen's inverted y-axis.
function calculatePointFromMetrics(
  startPoint: Point,
  distance: number,
  angle: number,
): Point {
  const angleInRadians = (angle * Math.PI) / 180;
  return {
    x: startPoint.x + distance * Math.cos(angleInRadians),
    // This ensures 90 degrees moves the point UP (Y-value decreases).
    y: startPoint.y - distance * Math.sin(angleInRadians),
  };
}

export type LinesAction =
  | { type: "set"; lines: Line[] }
  | {
      type: "update-point";
      index: number;
      pointIndex: 0 | 1;
      newPoint: Point;
      isConstrained: boolean;
    }
  | { type: "update-both-points"; index: number; newP0: Point; newP1: Point }
  | { type: "update-distance"; index: number; newDistance: string }
  | { type: "update-angle"; index: number; newAngle: string }
  | { type: "add"; line: Line }
  | { type: "remove"; index: number }
  | { type: "reset" }
  | { type: "update-unit-of-measure"; unitOfMeasure: Unit };

export default function linesReducer(
  state: Line[],
  action: LinesAction,
): Line[] {
  switch (action.type) {
    case "set":
      return action.lines;

    case "update-point":
      return state.map((line, i) => {
        if (i === action.index) {
          const newPoints = [...line.points] as SimpleLine;
          newPoints[action.pointIndex] = action.newPoint;
          // Recalculate distance and angle based on the new points
          return updateLineMeasurements(
            { ...line, points: newPoints },
            action.isConstrained,
          );
        }
        return line;
      });

    case "update-both-points":
      return state.map((line, i) => {
        if (i === action.index) {
          const newPoints = [action.newP0, action.newP1] as SimpleLine;
          // Recalculate distance and angle based on the new points
          return updateLineMeasurements({ ...line, points: newPoints });
        }
        return line;
      });

    case "update-distance":
      return state.map((line, i) => {
        if (i === action.index) {
          const newDistanceString = action.newDistance;
          const newDistanceNum = parseFloat(newDistanceString);

          // If the input is not a valid number, only update the distance string.
          // This prevents the line's geometry from changing while the user is typing or backspacing.
          if (isNaN(newDistanceNum)) {
            return { ...line, distance: newDistanceString };
          }

          const distanceInPixels =
            newDistanceNum *
            CSS_PIXELS_PER_INCH *
            (line.unitOfMeasure === Unit.CM ? 1 / 2.54 : 1);

          const p0 = line.points[0];
          // Use the precise angle from the line's points, not the rounded string.
          const preciseAngle = angleDeg(line.points);

          const newP1 = calculatePointFromMetrics(
            p0,
            distanceInPixels,
            preciseAngle,
          );

          const newPoints = [p0, newP1] as SimpleLine;
          // Don't call updateLineMeasurements to avoid overwriting the user's input.
          return { ...line, distance: newDistanceString, points: newPoints };
        }
        return line;
      });

    case "update-angle":
      return state.map((line, i) => {
        if (i === action.index) {
          const newAngleString = action.newAngle;
          const newAngleNum = parseFloat(newAngleString);

          // If the input is not a valid number, only update the angle string.
          if (isNaN(newAngleNum)) {
            return { ...line, angle: newAngleString };
          }

          // Use the precise distance from the line's points, not the rounded string.
          const preciseDistance = calculateDistance(line);

          const p0 = line.points[0];

          const newP1 = calculatePointFromMetrics(
            p0,
            preciseDistance * CSS_PIXELS_PER_INCH,
            newAngleNum,
          );

          const newPoints = [p0, newP1] as SimpleLine;
          // Don't call updateLineMeasurements to avoid overwriting the user's input.
          return { ...line, angle: newAngleString, points: newPoints };
        }
        return line;
      });

    case "add":
      return [...state, action.line];
    case "remove":
      return state.filter((_, i) => i !== action.index);
    case "reset":
      return [];
    case "update-unit-of-measure":
      return state.map((line) => {
        const newDistance = String(
          calculateDistance({
            ...line,
            unitOfMeasure: action.unitOfMeasure,
          }),
        );
        return {
          ...line,
          distance: newDistance,
          unitOfMeasure: action.unitOfMeasure,
        };
      });
    default:
      return state;
  }
}
