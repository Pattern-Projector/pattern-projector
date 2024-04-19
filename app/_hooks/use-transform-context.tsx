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

export interface TransformContextType {
  setLocalTransform: (localTransform: Matrix) => void;
  flipVertical: (centerPoint: Point) => void;
  flipHorizontal: (centerPoint: Point) => void;
  rotate: (centerPoint: Point, degrees: number) => void;
  recenter: (
    centerPoint: Point,
    layoutWidth: number,
    layoutHeight: number,
  ) => void;
  reset: () => void;
}

const TransformerContext = createContext<TransformContextType>({
  setLocalTransform: () => {},
  flipVertical: () => {},
  flipHorizontal: () => {},
  rotate: () => {},
  recenter: () => {},
  reset: () => {},
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