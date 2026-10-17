// Generates public/calibration-target.pdf, the printable target used by guided calibration.
// Run with: node scripts/make-calibration-target.mjs
import { PDFDocument, StandardFonts, rgb, LineCapStyle } from "@cantoo/pdf-lib";
import { writeFileSync } from "fs";

const inch = 72;
const pageWidth = 11 * inch; // US letter, landscape
const pageHeight = 8.5 * inch;
// Must match targetBoxInches in app/_lib/guided-calibration.ts. 8 x 6 in also fits A4.
const boxWidth = 8 * inch;
const boxHeight = 6 * inch;
const black = rgb(0, 0, 0);
const purple = rgb(0.58, 0.2, 0.92);

const doc = await PDFDocument.create();
doc.setTitle("Pattern Projector calibration target");
const page = doc.addPage([pageWidth, pageHeight]);
const font = await doc.embedFont(StandardFonts.Helvetica);
const bold = await doc.embedFont(StandardFonts.HelveticaBold);

// PDF y runs upwards, so work out the box from the bottom left
const left = (pageWidth - boxWidth) / 2;
const bottom = (pageHeight - boxHeight) / 2 - 0.15 * inch;
const right = left + boxWidth;
const top = bottom + boxHeight;
const cx = left + boxWidth / 2;
const cy = bottom + boxHeight / 2;

function line(x1, y1, x2, y2, thickness = 1, color = black) {
  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness,
    color,
    lineCap: LineCapStyle.Butt,
  });
}

function centredText(text, x, y, size, f = font) {
  page.drawText(text, {
    x: x - f.widthOfTextAtSize(text, size) / 2,
    y,
    size,
    font: f,
    color: black,
  });
}

// Box
page.drawRectangle({
  x: left,
  y: bottom,
  width: boxWidth,
  height: boxHeight,
  borderColor: black,
  borderWidth: 2,
});

// Centre lines across the box and a ring around the centre
line(left, cy, right, cy, 0.75);
line(cx, bottom, cx, top, 0.75);
page.drawCircle({
  x: cx,
  y: cy,
  size: 0.5 * inch,
  borderColor: purple,
  borderWidth: 2,
});
line(cx - 0.75 * inch, cy, cx + 0.75 * inch, cy, 2, purple);
line(cx, cy - 0.75 * inch, cx, cy + 0.75 * inch, 2, purple);

// Inch ruler along the top edge (inside the box), quarter inch ticks
for (let i = 0; i <= 32; i++) {
  const x = left + (i * inch) / 4;
  const len = i % 4 === 0 ? 0.3 : i % 2 === 0 ? 0.2 : 0.12;
  line(x, top, x, top - len * inch, 0.75);
  if (i % 4 === 0 && i > 0 && i < 32 && i !== 16) {
    centredText(String(i / 4), x, top - 0.45 * inch, 9);
  }
}
page.drawText("in", {
  x: left + 0.08 * inch,
  y: top - 0.45 * inch,
  size: 9,
  font,
  color: black,
});

// Centimetre ruler along the bottom edge (inside the box), millimetre ticks every 5 mm
const cm = inch / 2.54;
for (let i = 0; i <= 40; i++) {
  const x = left + (i * cm) / 2;
  const len = i % 2 === 0 ? 0.25 : 0.12;
  line(x, bottom, x, bottom + len * inch, 0.75);
  if (i % 2 === 0 && i > 0 && i < 40 && i !== 20) {
    centredText(String(i / 2), x, bottom + 0.32 * inch, 8);
  }
}
page.drawText("cm", {
  x: left + 0.06 * inch,
  y: bottom + 0.32 * inch,
  size: 8,
  font,
  color: black,
});

// "Top" arrow above the box
const ay = top + 0.15 * inch;
page.drawSvgPath(
  `M ${cx} ${-(ay + 0.45 * inch)} L ${cx - 0.18 * inch} ${-(ay + 0.2 * inch)} L ${cx + 0.18 * inch} ${-(ay + 0.2 * inch)} Z`,
  { x: 0, y: 0, color: black },
);
line(cx, ay, cx, ay + 0.25 * inch, 3);
page.drawText("TOP OF MAT", {
  x: cx + 0.3 * inch,
  y: ay + 0.12 * inch,
  size: 11,
  font: bold,
  color: black,
});

// Instructions
centredText(
  "Pattern Projector calibration target",
  pageWidth / 2,
  pageHeight - 0.5 * inch,
  14,
  bold,
);
centredText(
  'Print at 100% (Actual size), not "Fit to page". The box should measure exactly 8 x 6 inches (20.32 x 15.24 cm).',
  pageWidth / 2,
  0.55 * inch,
  10,
);
centredText(
  "Place it in the middle of your mat with the arrow pointing to the top of the mat.",
  pageWidth / 2,
  0.35 * inch,
  10,
);

writeFileSync(
  new URL("../public/calibration-target.pdf", import.meta.url),
  await doc.save(),
);
console.log("Wrote public/calibration-target.pdf");
