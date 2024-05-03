import {
  rotateToHorizontal,
  flipHorizontal,
  flipVertical,
  rotateMatrixDeg,
  transformPoint,
  translate,
} from "@/_lib/geometry";
import { Line } from "@/_lib/interfaces/line";
import { Point } from "@/_lib/point";
import Matrix from "ml-matrix";

interface FlipAction {
  type: "flip_vertical" | "flip_horizontal";
  centerPoint: Point;
}

interface RotateAction {
  type: "rotate";
  centerPoint: Point;
  degrees: number;
}

interface RecenterAction {
  type: "recenter";
  centerPoint: Point;
  layoutWidth: number;
  layoutHeight: number;
}

interface RotateToHorizontalAction {
  type: "rotate_to_horizontal";
  line: Line;
}

interface SetAction {
  type: "set";
  localTransform: Matrix;
}

interface ResetAction {
  type: "reset";
}

export type LocalTransformAction =
  | FlipAction
  | RotateToHorizontalAction
  | SetAction
  | RotateAction
  | RecenterAction
  | ResetAction;

export default function localTransformReducer(
  localTransform: Matrix,
  action: LocalTransformAction,
) {
  switch (action.type) {
    case "set": {
      return action.localTransform.clone();
    }
    case "rotate_to_horizontal": {
      return rotateToHorizontal(action.line).mmul(localTransform);
    }
    case "flip_vertical": {
      return flipVertical(action.centerPoint).mmul(localTransform);
    }
    case "flip_horizontal": {
      return flipHorizontal(action.centerPoint).mmul(localTransform);
    }
    case "rotate": {
      return rotateMatrixDeg(90, action.centerPoint).mmul(localTransform);
    }
    case "recenter": {
      const current = transformPoint(
        { x: action.layoutWidth * 0.5, y: action.layoutHeight * 0.5 },
        localTransform,
      );
      const p = {
        x: action.centerPoint.x - current.x,
        y: action.centerPoint.y - current.y,
      };
      return translate(p).mmul(localTransform);
    }
    case "reset": {
      return Matrix.identity(3);
    }
  }
}
