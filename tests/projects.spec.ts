import { test, expect, Page } from "@playwright/test";
import { PDFDocument, rgb } from "@cantoo/pdf-lib";
import { writeFileSync } from "fs";

const viewport = { width: 1280, height: 720 };
const points = [
  { x: 100, y: 100 },
  { x: 1180, y: 100 },
  { x: 1180, y: 660 },
  { x: 100, y: 660 },
];

async function makePattern(path: string, label: string) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([10 * 72, 8 * 72]);
  page.drawRectangle({
    x: 72,
    y: 72,
    width: 8 * 72,
    height: 6 * 72,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  page.drawText(label, { x: 100, y: 300, size: 48 });
  writeFileSync(path, await doc.save());
}

async function openPage(page: Page) {
  await page.setViewportSize(viewport);
  await page.addInitScript((points) => {
    if (localStorage.getItem("points") === null) {
      localStorage.setItem("points", JSON.stringify(points));
    }
  }, points);
  await page.goto("/en/calibrate");
  await expect(page.locator("canvas").first()).toBeVisible();
  await page.waitForLoadState("networkidle");
}

async function openFile(page: Page, path: string) {
  await page.locator("#pdfFile").setInputFiles(path);
  await expect(page.locator(".react-pdf__Page").first()).toBeVisible();
}

const patternTransform = (page: Page) =>
  page.locator('div[style*="matrix3d"]').first().getAttribute("style");

const projectNames = (page: Page) =>
  page.getByTestId("project").locator("span.font-medium").allInnerTexts();

test.describe("Saved projects", () => {
  test("switches between patterns without opening the files again", async ({
    page,
  }, testInfo) => {
    const shirt = testInfo.outputPath("Shirt.pdf");
    const pants = testInfo.outputPath("Pants.pdf");
    await makePattern(shirt, "Shirt");
    await makePattern(pants, "Pants");

    await openPage(page);
    // Leave calibration without a file; no projects yet, so the file picker opens
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Project", exact: true }).click();
    await (await chooser).setFiles(shirt);
    await expect(page.locator(".react-pdf__Page").first()).toBeVisible();

    // Turn the shirt pattern, which is saved for this pattern
    const before = await patternTransform(page);
    await page
      .getByRole("button", { name: "Rotate 90 degrees clockwise (R)" })
      .click();
    await expect.poll(() => patternTransform(page)).not.toBe(before);
    const shirtTransform = await patternTransform(page);

    await openFile(page, pants);
    await expect.poll(() => patternTransform(page)).not.toBe(shirtTransform);

    await page.getByRole("button", { name: "Projects", exact: true }).click();
    await expect
      .poll(() => projectNames(page))
      .toEqual(["PantsOpen now", "Shirt"]);

    // Come back later: the projects are still there and reopen where they were left
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Project", exact: true }).click();
    await expect(page.getByTestId("projects-list")).toBeVisible();
    await page.getByRole("button", { name: /^Shirt/ }).click();
    await expect(page.locator(".react-pdf__Page").first()).toBeVisible();
    await expect.poll(() => patternTransform(page)).toBe(shirtTransform);
  });

  test("renames and deletes projects", async ({ page }, testInfo) => {
    const shirt = testInfo.outputPath("Shirt.pdf");
    await makePattern(shirt, "Shirt");
    await openPage(page);
    await page.getByRole("button", { name: "Project", exact: true }).click();
    await openFile(page, shirt);

    await page.getByRole("button", { name: "Projects", exact: true }).click();
    await page.getByRole("button", { name: "Rename Shirt" }).click();
    await page.getByLabel("Project name").fill("Summer shirt");
    await page.getByLabel("Project name").press("Enter");
    await expect
      .poll(() => projectNames(page))
      .toEqual(["Summer shirtOpen now"]);

    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Project", exact: true }).click();
    await expect.poll(() => projectNames(page)).toEqual(["Summer shirt"]);

    await page.getByRole("button", { name: "Delete Summer shirt" }).click();
    await page.getByRole("button", { name: "Delete for good" }).click();
    await expect(page.getByTestId("project")).toHaveCount(0);
    expect(
      await page.evaluate(() =>
        localStorage.getItem("localTransform:Shirt.pdf"),
      ),
    ).toBeNull();
  });
});
