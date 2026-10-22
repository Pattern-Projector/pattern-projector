import { test, expect } from "@playwright/test";
import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";
import { writeFile } from "fs/promises";

// Allow the calibration route to compile when the test server starts cold.
test.setTimeout(60_000);

async function makePattern(text: string) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.addPage([400, 300]).drawText(text, { x: 20, y: 150, size: 16, font });
  return Buffer.from(await pdf.save());
}

test.beforeEach(async ({ page }) => {
  await page.goto("/en/calibrate", { waitUntil: "domcontentloaded" });
  // The canvas is sized by a React effect, after the file handler is attached.
  await expect(page.getByTestId("calibration-canvas")).toHaveAttribute(
    "width",
    String(page.viewportSize()!.width),
    { timeout: 20000 },
  );
});

test("clears the file picker without losing the selected PDF", async ({
  page,
}) => {
  const input = page.locator("#pdfFile");
  const text = page.locator(".react-pdf__Page__textContent");

  for (const name of ["first.pdf", "second.pdf"]) {
    await input.setInputFiles({
      name,
      mimeType: "application/pdf",
      buffer: await makePattern(name),
    });
    await expect(input).toHaveValue("");
    await expect(text).toContainText(name);
  }

  await input.setInputFiles({
    name: "invalid.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("This is not a pattern"),
  });
  await expect(input).toHaveValue("");
  await expect(text).toContainText("second.pdf");

  await input.setInputFiles([]);
  await expect(text).toContainText("second.pdf");
});

test("reselecting the same file triggers another change event", async ({
  page,
  browserName,
}, testInfo) => {
  test.skip(
    browserName !== "chromium",
    "Requires the Chromium native file-input API",
  );

  const file = testInfo.outputPath("pattern.pdf");
  await writeFile(file, await makePattern("Same pattern"));
  const input = page.locator("#pdfFile");
  await input.evaluate((element) => {
    element.dataset.changes = "0";
    element.addEventListener("change", () => {
      element.dataset.changes = String(Number(element.dataset.changes) + 1);
    });
  });

  // setInputFiles dispatches synthetic events. Use CDP here to reproduce the
  // browser's suppression of change when a file is still selected in the input.
  const client = await page.context().newCDPSession(page);
  const { root } = await client.send("DOM.getDocument");
  const { nodeId } = await client.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector: "#pdfFile",
  });
  for (let selection = 1; selection <= 2; selection++) {
    await client.send("DOM.setFileInputFiles", { nodeId, files: [file] });
    await expect(input).toHaveAttribute("data-changes", String(selection));
    await expect(page.locator(".react-pdf__Page__textContent")).toContainText(
      "Same pattern",
    );
  }
});
