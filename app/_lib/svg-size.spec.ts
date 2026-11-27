import { getSvgSize, parseSvgLength, svgSizeNeedsDpi } from "@/_lib/svg-size";

// US Letter: 8.5in x 11in = 816 x 1056 CSS px.
const LETTER = { width: 816, height: 1056 };

function sizeOf(
  width: string | null,
  height: string | null,
  viewBox: string | null,
  dpi: number,
) {
  const size = getSvgSize({ width, height, viewBox }, dpi);
  return (
    size && { width: +size.width.toFixed(4), height: +size.height.toFixed(4) }
  );
}

test("parses lengths", () => {
  expect(parseSvgLength("8.5in")).toEqual({ value: 8.5, unit: "in" });
  expect(parseSvgLength(" 612 ")).toEqual({ value: 612, unit: "" });
  expect(parseSvgLength("100%")).toEqual({ value: 100, unit: "%" });
  expect(parseSvgLength("abc")).toBeNull();
  expect(parseSvgLength(null)).toBeNull();
});

test("only unitless or relative sizes need a DPI", () => {
  expect(
    svgSizeNeedsDpi({ width: "8.5in", height: "11in", viewBox: null }),
  ).toBe(false);
  expect(
    svgSizeNeedsDpi({ width: "816px", height: "1056px", viewBox: null }),
  ).toBe(false);
  expect(svgSizeNeedsDpi({ width: "612", height: "792", viewBox: null })).toBe(
    true,
  );
  expect(
    svgSizeNeedsDpi({ width: "100%", height: "100%", viewBox: "0 0 612 792" }),
  ).toBe(true);
  expect(
    svgSizeNeedsDpi({ width: null, height: null, viewBox: "0 0 612 792" }),
  ).toBe(true);
});

test("absolute units ignore the DPI", () => {
  expect(sizeOf("8.5in", "11in", "0 0 215.9 279.4", 72)).toEqual(LETTER);
  expect(sizeOf("215.9mm", "279.4mm", null, 300)).toEqual(LETTER);
});

test("unitless sizes at 96 DPI (SVG standard)", () => {
  expect(sizeOf("816", "1056", null, 96)).toEqual(LETTER);
});

test("Affinity default export: 100% + viewBox at 72 DPI", () => {
  expect(sizeOf("100%", "100%", "0 0 612 792", 72)).toEqual(LETTER);
});

test("Affinity export with viewBox off: unitless at 72 DPI", () => {
  const size = getSvgSize({ width: "612", height: "792", viewBox: null }, 72);
  expect(size?.viewBox).toBe("0 0 612 792");
  expect(sizeOf("612", "792", null, 72)).toEqual(LETTER);
});

test("300 DPI document", () => {
  expect(sizeOf("100%", "100%", "0 0 2550 3300", 300)).toEqual(LETTER);
});

test("missing width/height uses the viewBox", () => {
  expect(sizeOf(null, null, "0 0 816 1056", 96)).toEqual(LETTER);
});

test("one absolute side keeps the viewBox aspect ratio", () => {
  expect(sizeOf("8.5in", "100%", "0 0 612 792", 72)).toEqual(LETTER);
});

test("returns null without enough information", () => {
  expect(
    getSvgSize({ width: "100%", height: "100%", viewBox: null }, 72),
  ).toBeNull();
});
