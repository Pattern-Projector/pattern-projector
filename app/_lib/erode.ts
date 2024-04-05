export function erosionFilter(erosions: number): string {
  if (erosions <= 0) {
    return "none";
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg">
  <filter id="erode-${erosions}">
    <feMorphology operator="dilate" radius="${erosions}" />
  </filter>
</svg>`;
  const url = `data:image/svg+xml;base64,${btoa(svg)}`;
  return `url(${url}#erode-${erosions})`;
}

export function erodeImageData(imageData: ImageData, output: ImageData) {
  const { width, height } = imageData;
  const erodedData = output.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      for (let i = 0; i < 4; i++) {
        erodedData[index + i] = erodeAtIndex(
          imageData,
          x,
          y,
          index + i,
          width,
          height,
        );
      }
    }
  }
}
// TODO: this is a dilate now, not an erode
function erodeAtIndex(
  imageData: ImageData,
  x: number,
  y: number,
  index: number,
  width: number,
  height: number,
): number {
  const { data } = imageData;
  let c = data[index];
  if (x > 0) {
    const n = data[index - 4];
    if (n > c) {
      c = n;
    }
  }
  if (x < width - 1) {
    const n = data[index + 4];
    if (n > c) {
      c = n;
    }
  }
  if (y > 0) {
    const n = data[index - width * 4];
    if (n > c) {
      c = n;
    }
  }
  if (y < height - 1) {
    const n = data[index + width * 4];
    if (n > c) {
      c = n;
    }
  }
  return c;
}
