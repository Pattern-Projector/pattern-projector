import Point from "./interfaces/point";

/**
 * Checks if p1 is in the radius of p2
 * @param p1 - Point 1
 * @param p2 - Point 2
 * @param p2 - Radius of p2
 * @returns - Whether or not p1 is in the radius of p2
 */
export default function isInRadius(
  p1: Point,
  p2: Point,
  radius: number
): boolean {
  return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 <= radius ** 2;
}
