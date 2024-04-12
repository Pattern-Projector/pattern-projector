import { Point, applyOffset } from "@/_lib/point";

interface OffsetAction {
  type: "offset";
  offset: Point;
  corners: Set<number>;
}

interface SetAction {
  type: "set";
  points: Point[];
}

interface InitializeAction {
  type: "initialize";
  points: Point[];
}

export type PointAction = OffsetAction | SetAction | InitializeAction;

export default function pointsReducer(points: Point[], action: PointAction) {
  switch (action.type) {
    case "initialize": {
      return [...action.points];
    }
    case "set": {
      localStorage.removeItem("calibrationContext");
      return [...action.points];
    }
    case "offset": {
      localStorage.removeItem("calibrationContext");
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
