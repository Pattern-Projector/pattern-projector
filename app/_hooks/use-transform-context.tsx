import { Line } from "@/_lib/interfaces/line";
import { Point } from "@/_lib/point";
import localTransformReducer from "@/_reducers/localTransformReducer";
import Matrix from "ml-matrix";
import {
  ReactNode,
  useContext,
  useMemo,
  useReducer,
  createContext,
} from "react";

export interface TransformerContextType {
  setLocalTransform: (localTransform: Matrix) => void;
  rotateToHorizontal: (line: Line) => void;
  flipAlong: (line: Line) => void;
  flipVertical: (centerPoint: Point) => void;
  flipHorizontal: (centerPoint: Point) => void;
  rotate: (centerPoint: Point, degrees: number) => void;
  recenter: (
    centerPoint: Point,
    layoutWidth: number,
    layoutHeight: number,
  ) => void;
  reset: () => void;
  translate: (p: Point) => void;
  align: (line: Line, to: Line) => void;
  magnify: (scale: number, point: Point) => void;
}

const TransformerContext = createContext<TransformerContextType>({
  setLocalTransform: () => {},
  rotateToHorizontal: () => {},
  flipVertical: () => {},
  flipHorizontal: () => {},
  rotate: () => {},
  recenter: () => {},
  reset: () => {},
  flipAlong: () => {},
  translate: () => {},
  align: () => {},
  magnify: () => {},
});

const TransformContext = createContext<Matrix>(Matrix.eye(3));

export function useTransformContext() {
  return useContext(TransformContext);
}

export function useTransformerContext() {
  return useContext(TransformerContext);
}

export const Transformable = ({ children }: { children: ReactNode }) => {
  const defaultState = Matrix.eye(3);
  const [transform, dispatch] = useReducer(localTransformReducer, defaultState);

  const api = useMemo(
    () => ({
      setLocalTransform: (localTransform: Matrix) =>
        dispatch({ type: "set", localTransform }),
      rotateToHorizontal: (line: Line) =>
        dispatch({ type: "rotate_to_horizontal", line }),
      flipAlong: (line: Line) => dispatch({ type: "flip_along", line }),
      translate: (p: Point) => dispatch({ type: "translate", p }),
      flipVertical: (centerPoint: Point) =>
        dispatch({ type: "flip_vertical", centerPoint }),
      flipHorizontal: (centerPoint: Point) =>
        dispatch({ type: "flip_horizontal", centerPoint }),
      rotate: (centerPoint: Point, degrees: number) =>
        dispatch({ type: "rotate", centerPoint, degrees }),
      recenter: (
        centerPoint: Point,
        layoutWidth: number,
        layoutHeight: number,
      ) =>
        dispatch({ type: "recenter", centerPoint, layoutWidth, layoutHeight }),
      reset: () => dispatch({ type: "reset" }),
      align: (line: Line, to: Line) => dispatch({ type: "align", line, to }),
      magnify: (scale: number, point: Point) =>
        dispatch({ type: "magnify", scale, point }),
    }),
    [dispatch],
  );

  return (
    <TransformerContext.Provider value={api}>
      <TransformContext.Provider value={transform}>
        {children}
      </TransformContext.Provider>
    </TransformerContext.Provider>
  );
};
