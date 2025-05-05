import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: "./e2e-tests",
    // Run tests in files in parallel.
    fullyParallel: true,
    // Fail the build on CI if you accidentally left test.only in the source code.
    forbidOnly: !!process.env.CI,
    // Retry on CI only.
    retries: process.env.CI ? 2 : 0,
    // Opt out of parallel tests on CI.
    workers: process.env.CI ? 1 : undefined,
    // Reporter to use. See https://playwright.dev/docs/test-reporters.
    reporter: "html",
    // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
    use: {
        // Base URL to use in actions like `await page.goto("/")`.
        // baseURL: "http://127.0.0.1:3000",

        // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer.
        trace: "on-first-retry",
        baseURL: "https://localhost:3000",
        ignoreHTTPSErrors: true
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        }
    ],

    webServer: {
        command: "npm run preview --workspace @jsonpath-tools/jsonpath-playground",
        url: "https://localhost:3000",
        reuseExistingServer: !process.env.CI,
        ignoreHTTPSErrors: true
    }
});
