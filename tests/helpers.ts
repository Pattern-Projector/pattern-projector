import { expect, Page } from "@playwright/test";
import { PDFDocument, rgb } from "@cantoo/pdf-lib";
import { writeFileSync } from "fs";

export const viewport = { width: 1280, height: 720 };
const points = [
  { x: 100, y: 100 },
  { x: 1180, y: 100 },
  { x: 1180, y: 660 },
  { x: 100, y: 660 },
];

export async function makePattern(path: string, label: string) {
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

// A returning user who calibrated before, in full screen unless told otherwise
export async function seedCalibration(
  page: Page,
  overrides: {
    fullScreen?: boolean;
    windowScreenLeft?: number;
    windowInnerWidth?: number;
  } = {},
) {
  await page.addInitScript(
    ({ points, viewport, overrides }) => {
      if (localStorage.getItem("points") === null) {
        // Safari on iPhone has no full screen, so calibration happens in the window there
        const fullScreen = document.fullscreenEnabled === true;
        localStorage.setItem("points", JSON.stringify(points));
        localStorage.setItem(
          "calibrationContext",
          JSON.stringify({
            windowInnerWidth: viewport.width,
            windowInnerHeight: viewport.height,
            windowScreenTop: 0,
            windowScreenLeft: 0,
            // Phones and tablets have their own pixel ratio
            devicePixelRatio: window.devicePixelRatio,
            clientScreenTop: 0,
            clientScreenLeft: 0,
            fullScreen,
            ...overrides,
          }),
        );
        // Some browsers give full screen a different size from the window (Firefox uses its 1366 × 768 screen).
        // Someone who calibrated in full screen recorded that size, so adopt it the first time full screen opens.
        if (fullScreen && overrides.windowInnerWidth === undefined) {
          const adoptFullScreenSize = () => {
            if (document.fullscreenElement === null) return;
            document.removeEventListener(
              "fullscreenchange",
              adoptFullScreenSize,
            );
            const saved = JSON.parse(
              localStorage.getItem("calibrationContext") ?? "{}",
            );
            localStorage.setItem(
              "calibrationContext",
              JSON.stringify({
                ...saved,
                windowInnerWidth: window.innerWidth,
                windowInnerHeight: window.innerHeight,
              }),
            );
          };
          document.addEventListener("fullscreenchange", adoptFullScreenSize);
        }
      }
    },
    { points, viewport, overrides },
  );
}

export const seedFullScreenCalibration = (page: Page) => seedCalibration(page);

export async function openApp(page: Page) {
  await page.setViewportSize(viewport);
  await page.goto("/en/calibrate");
  await waitForApp(page);
}

// The home screen shows before React has attached its event handlers, and clicks made before then are lost.
// Firefox and Safari take longer to get there, so wait for the handlers rather than for the network.
export async function waitForApp(page: Page) {
  await expect(home(page)).toBeVisible();
  await page.waitForFunction(() => {
    const button = document.querySelector(
      '[data-testid="projects-home"] button',
    );
    return (
      button !== null &&
      Object.keys(button).some((key) => key.startsWith("__reactProps$"))
    );
  });
}

export async function addPattern(page: Page, path: string, name: string) {
  await page.locator("#pdfFile").setInputFiles(path);
  await expect(home(page).getByRole("status")).toContainText(
    `${name} is added`,
  );
}

export const home = (page: Page) => page.getByTestId("projects-home");
// Safari on iPhone has no full screen for web pages
export const canFullScreen = (page: Page) =>
  page.evaluate(() => document.fullscreenEnabled === true);
// Full screen can change the window size (Firefox grows to its screen size), and the page animates to the new size.
// Wait until it has finished, so drags and screenshots use the final layout.
export async function waitForFullScreenToSettle(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const element = document.fullscreenElement;
        if (element === null) return true;
        const rect = element.getBoundingClientRect();
        return (
          rect.width === window.innerWidth && rect.height === window.innerHeight
        );
      }),
    )
    .toBe(true);
  // Let any running transition finish drawing
  await page.waitForTimeout(600);
}

// Opening a pattern goes full screen wherever the browser allows it
export async function expectFullScreen(page: Page) {
  if (await canFullScreen(page)) {
    await expect.poll(() => isFullScreen(page)).toBe(true);
  }
}
export const windowSize = (page: Page) =>
  page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
export const isFullScreen = (page: Page) =>
  page.evaluate(() => document.fullscreenElement !== null);
export const patternTransform = (page: Page) =>
  page.locator('div[style*="matrix3d"]').first().getAttribute("style");
export const projectNames = (page: Page) =>
  page.getByTestId("project").locator("span.font-medium").allInnerTexts();
export const pdfPage = (page: Page) => page.locator(".react-pdf__Page").first();
// Rendering a PDF page can take several seconds on a slow or busy machine
export const renderTimeout = 15000;
