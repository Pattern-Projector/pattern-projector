import { useEffect, useState, useRef } from "react";
import { decomposeTransformMatrix } from "@/_lib/geometry";
import { IN, CM } from "@/_lib/unit";
import { Matrix } from "ml-matrix";
import { useKeyToggle } from "@/_hooks/use-key-toggle"
import { KeyCode } from "@/_lib/key-code"

function getSmallestDenom(
  value: number,
  fractionGranularity: number,
  epsilon: number = 0.000001,
): number | null {
  if (fractionGranularity < 2) return null;
  const integerPart = Math.floor(value);
  const decimalPart = value - integerPart;
  let denominator = fractionGranularity;
  let smallestFound = null;
  while (denominator > 1) {
    if (
      Math.abs(
        Math.round(decimalPart * denominator) / denominator - decimalPart,
      ) > epsilon
    ) {
      return smallestFound;
    }
    smallestFound = denominator;
    denominator /= 2;
  }
  return smallestFound;
}

function formatValue(
  value: number,
  unitOfMeasure: string,
  fractionGranularity: number,
  showSign: boolean = true,
  epsilon: number = 0.000001,
) {
  let sign = ""
  if (showSign)
    sign = value >= 0 ? " " : "-";
  const posValue = Math.abs(value);
  if (unitOfMeasure === IN) {
    const integerPart = Math.floor(posValue);
    const decimalPart = posValue - integerPart;
    const denominator = getSmallestDenom(posValue, fractionGranularity);
    /* No fraction could be made */
    if (denominator === null) {
      return `${sign}${posValue.toFixed(2)}`;
    }
    /* Decimal is small enough to just use whole number */
    if (decimalPart < epsilon) {
      return `${sign}${posValue.toFixed(0)}`;
    }

    const numerator = Math.round(decimalPart * denominator);

    if (denominator !== null) {
      return integerPart === 0
        ? `${sign}${numerator}\u2044${denominator}`
        : `${sign}${integerPart}-${numerator}\u2044${denominator}`;
    }

    return `${sign}${posValue.toFixed(2)}`;
  }

  return `${sign}${posValue.toFixed(2)}`;
}

/* fractionGranularity MUST be a power of two greater than or equal to 2 */
export default function TransformMatrixDisplay({
  matrix,
  unitOfMeasure,
  preventReset,
  fractionGranularity = 16,
  timeout = 1000,
  className,
}: {
  matrix: Matrix;
  unitOfMeasure: string;
  preventReset: boolean;
  className?: string | undefined;
  fractionGranularity?: number;
  timeout?: number;
}) {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const previousMatrix = useRef<Matrix>(matrix);
  const initialMatrix = useRef<Matrix | null>(null);
  const resetNeeded = useRef<boolean>(false);
  const [lockKeyToggled, setLockKeyToggled] = useState<boolean>(false);
  const [lockKeyWasToggled, setLockKeyWasToggled] = useState<boolean>(false);

  useKeyToggle(setLockKeyToggled, [KeyCode.KeyL]);

  useEffect(() => {
    setIsVisible(true);
    if (initialMatrix.current === null || resetNeeded.current){
      resetNeeded.current = false;
      initialMatrix.current = previousMatrix.current;
      if (!lockKeyToggled){
        setLockKeyWasToggled(false);
      }
    }

    previousMatrix.current = matrix;

    if (lockKeyToggled){
      setLockKeyWasToggled(true);
    }

    if (preventReset || lockKeyToggled)
      return;

    const timer = setTimeout(() => {
      resetNeeded.current = true;
      setIsVisible(false);
    }, timeout);

    return () => {
      clearTimeout(timer);
    };
  }, [matrix, preventReset, lockKeyToggled]);

  useEffect(() => {
    if (preventReset === false && lockKeyToggled === false) {
      resetNeeded.current = true;
      setIsVisible(false);
    }
  }, [preventReset, lockKeyToggled])

  const decomposed = decomposeTransformMatrix(matrix);
  const position = decomposed.translation;

  let delta = { x: 0, y: 0 };
  if (initialMatrix.current !== null) {
    const deltaMatrix = Matrix.sub(matrix, initialMatrix.current);
    const decomposedDelta = decomposeTransformMatrix(deltaMatrix);
    delta = decomposedDelta.translation;
  }

  const xlabel = delta.x >= 0 ? "Right" : "Left";
  const ylabel = delta.y > 0 ? "Down" : "Up";
  const units = unitOfMeasure === IN ? '"' : " cm";

  if (!(lockKeyToggled || lockKeyWasToggled) && delta.x === 0 && delta.y === 0) {
    return null;
  }

  const forceDisplay = lockKeyToggled || lockKeyWasToggled;

  return (
    <div
      className={`absolute bg-white dark:bg-black text-current w-36 top-20
      right-4 rounded-lg shadow pr-2 pl-2 pt-1 pb-1 transition-opacity
      ease-out select-none
      ${isVisible ? "opacity-100 duration-0" : "opacity-0 duration-500"}
      ${className}
      `}
    >
      <pre className="text-md grid grid-cols-[auto_1fr] gap-1">
        {(delta.x !== 0 || forceDisplay) && (
          <>
            <span>{xlabel}:</span>
            <span>
              {formatValue(Math.abs(delta.x), unitOfMeasure, fractionGranularity, false)}{units}
            </span>
          </>
        )}
        {(delta.y !== 0 || forceDisplay) && (
          <>
            <span>{ylabel}:</span>
            <span>
              {formatValue(Math.abs(delta.y), unitOfMeasure, fractionGranularity, false)}{units}
            </span>
          </>
        )}
      </pre>
    </div>
  );
}
