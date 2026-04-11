import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Directory where tests are located
  testDir: "./tests",

  // Timeout for each test in milliseconds (e.g., 30 seconds)
  timeout: 30 * 1000,

  // Maximum time to wait for assertions to pass
  expect: {
    timeout: 5000,
    // Tolerance for visual regression testing (0.01 = 1% pixel difference)
    // Adjust this value based on how sensitive you want the visual tests to be.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit the number of workers to prevent resource exhaustion on CI/local machine
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: "html",

  // Output directory for test results and artifacts (screenshots, videos, etc.)
  outputDir: "test-results/",

  /* ================================================
    Web Server Configuration for Next.js
    ================================================
    This starts your Next.js development server before running tests. 
  */
  webServer: {
    // This assumes you have 'next dev' in your package.json scripts
    command: "npm run dev",
    url: "http://localhost:3000",
    timeout: 120 * 1000, // 2 minutes to wait for the server to start
    reuseExistingServer: !process.env.CI, // Don't restart the server if one is already running locally
  },

  projects: [
    // ===================================
    // 1. Desktop Projects
    // ===================================
    {
      name: "Desktop Chrome",
      use: {
        browserName: "chromium", // Explicitly set for clarity
        ...devices["Desktop Chrome"],
        contextOptions: { reducedMotion: "reduce" },
      },
    },
    {
      name: "Desktop Firefox",
      use: {
        browserName: "firefox",
        ...devices["Desktop Firefox"],
        contextOptions: { reducedMotion: "reduce" },
      },
    },
    {
      name: "Desktop Safari",
      use: {
        browserName: "webkit",
        ...devices["Desktop Safari"],
        contextOptions: { reducedMotion: "reduce" },
      },
    },

    // ===================================
    // 2. Mobile Portrait Projects
    // ===================================
    {
      name: "Mobile Chrome (Portrait)",
      use: {
        browserName: "chromium",
        ...devices["Pixel 5"],
        contextOptions: { reducedMotion: "reduce" },
      },
    },
    {
      name: "Mobile Firefox (Portrait)",
      use: {
        browserName: "firefox",
        // We use a custom viewport instead of a device preset to avoid
        // inheriting 'chromium' but keep a similar size.
        viewport: { width: 393, height: 851 }, // Pixel 5 dimensions
        contextOptions: { reducedMotion: "reduce" },
      },
    },
    {
      name: "Mobile Safari (Portrait)",
      use: {
        browserName: "webkit",
        ...devices["iPhone 13"],
        contextOptions: { reducedMotion: "reduce" },
      },
    },

    // ===================================
    // 3. Mobile Landscape Projects
    // ===================================
    {
      name: "Mobile Chrome (Landscape)",
      use: {
        browserName: "chromium",
        ...devices["Pixel 5"],
        viewport: { width: 851, height: 393 },
        contextOptions: { reducedMotion: "reduce" },
      },
    },
    {
      name: "Mobile Firefox (Landscape)",
      use: {
        browserName: "firefox",
        viewport: { width: 851, height: 393 },
        contextOptions: { reducedMotion: "reduce" },
      },
    },
    {
      name: "Mobile Safari (Landscape)",
      use: {
        browserName: "webkit",
        viewport: { width: 844, height: 390 },
        contextOptions: { reducedMotion: "reduce" },
      },
    },
  ],

  /* ================================================
    Global Use Options
    ================================================
    These options are passed to all tests in all projects.
  */
  use: {
    // Base URL to use in test.goto(). This aligns with the webServer URL.
    baseURL: "http://localhost:3000",

    // Capture screenshot/video/trace only on first retry.
    trace: "on-first-retry",
  },
});
