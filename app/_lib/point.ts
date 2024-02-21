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

export function mouseToCanvasPoint(e: React.MouseEvent<Element>): Point {
  return { x: e.screenX, y: e.screenY };
}

export function touchToCanvasPoint(e: React.TouchEvent<Element>): Point {
  return { x: e.touches[0].screenX, y: e.touches[0].screenY };
}

export function applyOffset(point:Point, offset:Point): Point {
  return { x: point.x + offset.x, y: point.y + offset.y };
}
