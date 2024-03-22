import { Point } from "./point";

/* Creates a checkerboard pattern for the canvas context */
export function createCheckerboardPattern(
  ctx: CanvasRenderingContext2D,
  size: number = 3,
  color1: string = "black",
  color2: string = "#CCC"
  ): CanvasPattern {
  /* We first create a new canvas on which to draw the pattern */
  const patternCanvas = document.createElement('canvas');
  try {
    const patternCtx = patternCanvas.getContext('2d');

    if (!patternCtx) {
      throw new Error('Failed to get 2D context from pattern canvas');
    }
  
    /* Integer which defines the size of a checkboard square (in pixels) */
    size = Math.round(size)

    patternCanvas.width = size*2;
    patternCanvas.height = size*2;

    /* Draw the checkerboard pattern */
    patternCtx.fillStyle = color1;
    patternCtx.fillRect(0, 0, size, size);
    patternCtx.fillRect(size, size, size, size);
    patternCtx.fillStyle = color2;
    patternCtx.fillRect(size, 0, size, size);
    patternCtx.fillRect(0, size, size, size);

    /* Create the pattern from the canvas */
    const pattern = ctx.createPattern(patternCanvas, 'repeat');

    if (!pattern) {
      throw new Error('Failed to create pattern from canvas');
    }

    return pattern;
  } finally {
    /* Clean up the dynamically created canvas element */
    patternCanvas.remove();
  }
}

export function drawLine(
  ctx: CanvasRenderingContext2D,
  p1: Point,
  p2: Point,
  lineWidth: number = 1,
): void {
  ctx.beginPath();
  ctx.lineWidth = lineWidth;
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}
