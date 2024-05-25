/**
 * The location of a pixel on the screen
 * https://developer.mozilla.org/en-US/docs/Web/CSS/CSSOM_view/Coordinate_systems
 */
export interface Point {
  /**
   * Horizontal offset from the left of the screen
   */
  readonly x: number;
  /**
   * Vertical offset from the top of the screen
   */
  readonly y: number;
}

export function applyOffset(point: Point, offset: Point): Point {
  return { x: point.x + offset.x, y: point.y + offset.y };
}

export function subtract(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}
