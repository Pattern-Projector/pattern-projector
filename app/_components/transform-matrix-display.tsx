import { useEffect, useState, useRef } from "react";
import { decomposeTransformMatrix } from "@/_lib/geometry";
import { IN, CM } from "@/_lib/unit";
import { Matrix } from "ml-matrix";

function getSmallestDenom(
  value: number,
  fractionGranularity: number,
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
      ) > 0.001
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
) {
  const sign = value >= 0 ? " " : "-";
  const posValue = Math.abs(value);
  if (unitOfMeasure === IN) {
    const integerPart = Math.floor(posValue);
    const decimalPart = posValue - integerPart;
    const denominator = getSmallestDenom(posValue, fractionGranularity);
    /* No fraction could be made */
    if (decimalPart < 0.001 || denominator === null) {
      return `${sign}${posValue.toFixed(0)}`;
    }

    const numerator = Math.round(decimalPart * denominator);

    if (denominator !== null) {
      return integerPart === 0
        ? `${sign}${numerator}/${denominator}`
        : `${sign}${integerPart} ${numerator}/${denominator}`;
    }

    return `${sign}${posValue.toFixed(2)}`;
  }

  return `${sign}${posValue.toFixed(2)}`;
}

/* fractionGranularity MUST be a power of two greater than or equal to 2 */
export default function TransformMatrixDisplay({
  matrix,
  unitOfMeasure,
  fractionGranularity = 16,
  timeout = 1000,
  className,
}: {
  matrix: Matrix;
  unitOfMeasure: string;
  className?: string | undefined;
  fractionGranularity?: number;
  timeout?: number;
}) {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const previousMatrix = useRef<Matrix>(matrix);
  const initialMatrix = useRef<Matrix | null>(null);

  useEffect(() => {
    setIsVisible(true);
    if (initialMatrix.current === null)
      initialMatrix.current = previousMatrix.current;

    const timer = setTimeout(() => {
      initialMatrix.current = null;
      setIsVisible(false);
    }, timeout);

    previousMatrix.current = matrix;
    return () => {
      clearTimeout(timer);
    };
  }, [matrix]);

  const decomposed = decomposeTransformMatrix(matrix);
  const position = decomposed.translation;

  let delta = { x: 0, y: 0 };
  if (initialMatrix.current !== null) {
    const deltaMatrix = Matrix.sub(matrix, initialMatrix.current);
    const decomposedDelta = decomposeTransformMatrix(deltaMatrix);
    delta = decomposedDelta.translation;
  }

  return (
    <div
      className={`absolute bg-white dark:bg-black text-current w-56 top-20
      right-4 rounded-lg shadow pr-2 pl-2 pt-1 pb-1 transition-opacity
      ease-out select-none
      ${isVisible ? "opacity-100 duration-0" : "opacity-0 duration-500"}
      ${className}
      `}
    >
      <pre className="text-sm grid grid-cols-8 gap-1">
        <span>x:</span>
        <span className="col-span-3">
          {formatValue(position.x, unitOfMeasure, fractionGranularity)}
        </span>
        <span>y:</span>
        <span className="col-span-3">
          {formatValue(position.y, unitOfMeasure, fractionGranularity)}
        </span>
        <span>Δx:</span>
        <span className="col-span-3">
          {formatValue(delta.x, unitOfMeasure, fractionGranularity)}
        </span>
        <span>Δy:</span>
        <span className="col-span-3">
          {formatValue(delta.y, unitOfMeasure, fractionGranularity)}
        </span>
      </pre>
    </div>
  );
}
