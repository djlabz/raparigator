import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import ageVerifiedState from "./tests/storage/age-verified.json" with { type: "json" };

const port = Number(process.env.PORT ?? 3100);
const baseURL = `http://localhost:${port}`;
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";
const isCI = !!process.env.CI;
const logDir = path.join(__dirname, "webserver-logs");
const webCommand = isCI ? "npm run start" : `npm run dev -- --port ${port}`;

function withLog(command: string, name: string) {
  const file = path.join(logDir, `webserver-${name}.log`);
  return `mkdir -p "${logDir}" && exec ${command} > "${file}" 2>&1`;
}

const storageState = {
  ...ageVerifiedState,
  origins: ageVerifiedState.origins.map((entry) => ({ ...entry, origin: baseURL })),
};

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global-setup.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: 0,
  maxFailures: isCI ? 5 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [["list"], ["github"], ["html", { open: "never" }]] : "list",
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
      command: withLog("npm run dev:api", "api"),
      cwd: "../..",
      url: `${apiUrl}/healthz`,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      env: {
        IDENTITY_REQUIRED: "true",
      },
    },
    {
      command: withLog(webCommand, "web"),
      url: baseURL,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      env: {
        PORT: String(port),
        NEXT_PUBLIC_API_URL: apiUrl,
        ...(isCI ? { HOSTNAME: "0.0.0.0" } : {}),
      },
    },
  ],
});
