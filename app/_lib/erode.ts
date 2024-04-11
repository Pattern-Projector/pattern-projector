export function erosionFilter(erosions: number): string {
  if (erosions <= 0) {
    return "none";
  }
  const result = [];
  while (erosions > 0) {
    if (erosions >= 3) {
      result.push("url(#erode-3)");
      erosions -= 3;
    } else if (erosions >= 2) {
      result.push("url(#erode-2)");
      erosions -= 2;
    } else {
      result.push("url(#erode-1)");
      erosions -= 1;
    }
  }
  return result.join(" ");
}

export function erode(imageData: ImageData, radius: number) {
  const { width, height, data } = imageData;
  const size = 2 * radius + 1;
  const r = new MinWindow(size);
  const g = new MinWindow(size);
  const b = new MinWindow(size);
  let i = 0;
  let o = -4 * size; // TODO: handle literal edge cases.
  for (let y = 0; y < height; y++) {
    r.clear();
    g.clear();
    b.clear();
    for (let x = 0; x < width; x++) {
      data[o++] = r.push(data[i++]);
      data[o++] = g.push(data[i++]);
      data[o++] = b.push(data[i++]);
      data[o++] = 255;
      i++;
    }
  }
  for (let x = 0; x < width; x++) {
    r.clear();
    g.clear();
    b.clear();
    for (let y = 0; y < height; y++) {
      i = (y * width + x) * 4;
      o = i - 4 * size * width;
      data[o++] = r.push(data[i++]);
      data[o++] = g.push(data[i++]);
      data[o++] = b.push(data[i++]);
    }
} 
}
class MinWindow {
  size: number;
  data: number[];
  min: number;

  constructor(size: number) {
    this.size = size;
    this.data = [];
    this.min = 255;
  }

  push(value: number) {
    const { data, min, size } = this;
    if (value < min) {
      this.min = value;
    }
    if (data.length > size) {
      const old = data.shift();
      if (old === min && value > min) {
        this.min = Math.min(...data);
      }
    }
    data.push(value);
    return this.min;
  }

  clear() {
    this.data = [];
    this.min = 255;
  }
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
    if (n < c) {
      c = n;
    }
  }
  if (x < width - 1) {
    const n = data[index + 4];
    if (n < c) {
      c = n;
    }
  }
  if (y > 0) {
    const n = data[index - width * 4];
    if (n < c) {
      c = n;
    }
  }
  if (y < height - 1) {
    const n = data[index + width * 4];
    if (n < c) {
      c = n;
    }
  }
  return c;
}