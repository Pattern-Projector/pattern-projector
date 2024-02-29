import { Point } from '@/_lib/point';

export interface TransformSettings {
  scale: Point;
  degrees: number;
  inverted: boolean;
  isInvertedGreen: boolean;
  isFourCorners: boolean;
}

export function getDefaultTransforms() {
  return {
    degrees: 0,
    scale: { x: 1, y: 1 },
    inverted: false,
    isInvertedGreen: false,
    isFourCorners: true,
  };
}
