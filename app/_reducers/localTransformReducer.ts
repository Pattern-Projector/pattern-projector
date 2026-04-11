import {
  align,
  move,
  rotateToHorizontal,
  flipAlong,
  flipHorizontal,
  flipVertical,
  rotateMatrixDeg,
  transformPoint,
  translate,
  scaleAboutPoint,
} from "@/_lib/geometry";
import { Line } from "@/_reducers/linesReducer";
import { Point } from "@/_lib/point";
import Matrix from "ml-matrix";

export type LocalTransformAction =
  | { type: "flip_vertical" | "flip_horizontal"; centerPoint: Point }
  | { type: "rotate"; centerPoint: Point; degrees: number }
  | {
      type: "recenter";
      centerPoint: Point;
      layoutWidth: number;
      layoutHeight: number;
    }
  | { type: "rotate_to_horizontal"; line: Line }
  | { type: "flip_along"; line: Line }
  | { type: "translate"; p: Point }
  | { type: "set"; localTransform: Matrix }
  | { type: "reset" }
  | { type: "align"; line: Line; to: Line }
  | { type: "magnify"; scale: number; point: Point };

export default function localTransformReducer(
  localTransform: Matrix,
  action: LocalTransformAction,
) {
  switch (action.type) {
    case "set": {
      return action.localTransform.clone();
    }
    case "rotate_to_horizontal": {
      return rotateToHorizontal(action.line.points).mmul(localTransform);
    }
    case "flip_along": {
      return flipAlong(action.line.points).mmul(localTransform);
    }
    case "translate": {
      return translate(action.p).mmul(localTransform);
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
      return move(current, action.centerPoint).mmul(localTransform);
    }
    case "reset": {
      return Matrix.identity(3);
    }
    case "align": {
      return align(action.line.points, action.to.points).mmul(localTransform);
    }
    case "magnify": {
      return scaleAboutPoint(action.scale, action.point).mmul(localTransform);
    }
  }
}
