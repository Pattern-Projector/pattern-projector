import { Point, applyOffset } from "@/_lib/point";

export type PointAction =
  | { type: "offset"; offset: Point; corners: Set<number> }
  | { type: "set"; points: Point[] };

export default function pointsReducer(
  points: Point[],
  action: PointAction,
): Point[] {
  const newPoints = reducePoints(points, action);
  localStorage.setItem("points", JSON.stringify(newPoints));
  return newPoints;
}

function reducePoints(points: Point[], action: PointAction) {
  switch (action.type) {
    case "set": {
      return [...action.points];
    }
    case "offset": {
      return points.map((p, i) => {
        if (action.corners.has(i)) {
          return applyOffset(p, action.offset);
        } else {
          return p;
        }
      });
    }
  }
}
