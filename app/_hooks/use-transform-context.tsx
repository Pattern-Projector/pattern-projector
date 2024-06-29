import debounce from "@/_lib/debounce";
import { Line } from "@/_lib/interfaces/line";
import { Point } from "@/_lib/point";
import localTransformReducer, {
  LocalTransformAction,
} from "@/_reducers/localTransformReducer";
import Matrix from "ml-matrix";
import {
  ReactNode,
  useContext,
  useMemo,
  useReducer,
  createContext,
  Dispatch,
  useCallback,
  useEffect,
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
});

const DEFAULT_TRANSFORM = Matrix.eye(3);
const TransformContext = createContext<Matrix>(DEFAULT_TRANSFORM);

export function useTransformContext() {
  return useContext(TransformContext);
}

export function useTransformerContext() {
  return useContext(TransformerContext);
}

export const Transformable = ({
  children,
  fileName,
}: {
  children: ReactNode;
  fileName: string;
}) => {
  const [transform, dispatchInternal] = useReducer(
    localTransformReducer,
    DEFAULT_TRANSFORM,
  );
  const dispatch: Dispatch<LocalTransformAction> = useCallback(
    (action: LocalTransformAction) => {
      dispatchInternal(action);
      // Also store the new local transform in local storage so that
      // we can restore it when the same file gets opened again later on
      const newTransform = localTransformReducer(transform, action);
      debouncedWriteToLocalStorage(fileName, newTransform);
    },
    [transform, fileName],
  );

  useEffect(() => {
    // When we load a different file, reset the local transform to the
    // value that was stored the last time the user viewed this file,
    // or the identity matrix if this is the first time.
    dispatchInternal({
      type: "set",
      localTransform: readFromLocalStorage(fileName),
    });
  }, [fileName]);

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

// Let's not write to local storage too often, but rather wait until the user is done.
const debouncedWriteToLocalStorage = debounce(writeToLocalStorage, 500);

function writeToLocalStorage(fileName: string, transform: Matrix) {
  localStorage.setItem(`localTransform:${fileName}`, JSON.stringify(transform));
}

function readFromLocalStorage(fileName: string): Matrix {
  const rawValue = localStorage.getItem(`localTransform:${fileName}`);
  if (rawValue == null) {
    return DEFAULT_TRANSFORM;
  }
  try {
    return new Matrix(JSON.parse(rawValue));
  } catch {
    return DEFAULT_TRANSFORM;
  }
}
