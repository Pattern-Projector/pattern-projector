/**
 * The location of a pixel on the screen
 * https://developer.mozilla.org/en-US/docs/Web/CSS/CSSOM_view/Coordinate_systems
 */
export default interface Point {
  /**
   * Horizontal offset from the left of the screen
   */
  readonly x: number;
  /**
   * Vertical offset from the top of the screen
   */
  readonly y: number;
}