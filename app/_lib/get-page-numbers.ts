import { LineDirection } from "./interfaces/stitch-settings";

export function getPageNumbers(pageRange: string, pageCount: number): number[] {
  const ranges = pageRange.split(",");
  let pages = [];
  for (const r of ranges) {
    if (r.indexOf("-") < 0) {
      pages.push(Math.min(pageCount, Number(r)));
    } else {
      const [start, end] = r.split("-");
      const s = Number(start);
      const e = end === "" ? pageCount : Number(end);
      let a = Math.min(pageCount, Math.min(s, e));
      const b = Math.min(Math.max(s, e), pageCount);
      while (b >= a) {
        pages.push(a);
        a++;
      }
    }
  }
  if (pages.length === 0) {
    pages = [...Array(pageCount).keys()].map((x) => ++x);
  }
  return pages;
}

export function getPageRange(pageNumbers: number[]): string {
  let start = -1;
  let end = -1;
  const builder: string[] = [];
  function range(start: number, end: number): string {
    if (start < 0) {
      return "";
    }
    return start == end ? `${start}` : `${start}-${end}`;
  }
  for (const page of pageNumbers) {
    if (start < 1) {
      // not valid
      start = page;
      end = page;
    } else if (page == end + 1 && end >= start) {
      end++;
    } else if (page == end - 1 && end <= start) {
      end--;
    } else {
      builder.push(range(start, end));
      start = end = page;
    }
  }
  builder.push(range(start, end));
  return builder.join(",");
}

export function rotateRange(
  pageRange: string,
  pageCount: number,
  increment: number,
): string {
  const numbers = getPageNumbers(pageRange, pageCount);
  if (increment > 0) {
    // increment
    if (numbers.length == 1) {
      // single page
      const a = numbers.shift();
      if (a !== undefined) {
        if (a == pageCount) {
          // wrap to first
          numbers.push(1);
        } else {
          numbers.push(a + 1); // move to next
        }
      }
    } else {
      // rotate range
      const a = numbers.shift();
      if (a !== undefined) {
        numbers.push(a);
      }
    }
  } else {
    // decrement
    if (numbers.length == 1) {
      // single page move to previous
      const a = numbers.pop();
      if (a !== undefined) {
        if (a <= 1) {
          numbers.push(pageCount);
        } else {
          numbers.push(a - 1);
        }
      }
    } else {
      // rotate range
      const a = numbers.pop();
      if (a !== undefined) {
        numbers.unshift(a);
      }
    }
  }
  return getPageRange(numbers);
}

export function getRowsColumns(
  pages: number[],
  lineCount: number,
  lineDirection: LineDirection,
): [number, number] {
  const itemCount = pages.length;
  const a = Math.max(Math.min(lineCount, itemCount), 1);
  const otherCount = Math.ceil((itemCount || 1) / a);
  const isColumn = lineDirection == LineDirection.Column;
  return isColumn ? [otherCount, a] : [a, otherCount];
}
