export function erosionFilter(erosions: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg">
  <filter id="erode">
    <feMorphology operator="erode" radius="${erosions}" />
  </filter>
</svg>`;
  const url = `data:image/svg+xml;base64,${btoa(svg)}`;
  return `url(${url}#erode)`;
}

export function erodeImageData(imageData: ImageData, output: ImageData) {
  const { width, height, data } = imageData;
  const erodedData = output.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let index = (y * width + x) * 4;
      for (let i = 0; i < 3; i++) {
        erodedData[index + i] = erodeAtIndex(
          imageData,
          x,
          y,
          index,
          width,
          height,
        );
      }
      erodedData[index + 3] = 255;
    }
  }
}

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
  if (c !== 255) {
    return 0;
  }
  if (x > 0) {
    let n = data[index - 4];
    if (n < c) {
      c = n;
    }
  }
  if (x < width - 1) {
    let n = data[index + 4];
    if (n < c) {
      c = n;
    }
  }
  if (y > 0) {
    let n = data[index - width * 4];
    if (n < c) {
      c = n;
    }
  }
  if (y < height - 1) {
    let n = data[index + width * 4];
    if (n < c) {
      c = n;
    }
  }
  return c;
}