import { defineConfig, devices } from "@playwright/test";
import ageVerifiedState from "./tests/storage/age-verified.json" with { type: "json" };

const port = Number(process.env.PORT ?? 3000);
const baseURL = `http://localhost:${port}`;
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";
const storageState = {
  ...ageVerifiedState,
  origins: ageVerifiedState.origins.map((entry) => ({ ...entry, origin: baseURL })),
};

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    storageState,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "pt-BR",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run dev:api -w apps/api",
      url: `${apiUrl}/healthz`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `npm run dev -- --port ${port}`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        PORT: String(port),
        NEXT_PUBLIC_API_URL: apiUrl,
      },
    },
  ],
});
