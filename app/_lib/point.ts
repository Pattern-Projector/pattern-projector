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
  return { x: e.clientX, y: e.clientY };
}

export function nativeMouseToCanvasPoint(e: MouseEvent): Point {
  return { x: e.pageX, y: e.pageY };
}

export function touchToCanvasPoint(e: React.TouchEvent<Element>): Point {
  return { x: e.touches[0].clientX, y: e.touches[0].clientY };
}

export function applyOffset(point: Point, offset: Point): Point {
  return { x: point.x + offset.x, y: point.y + offset.y };
}
