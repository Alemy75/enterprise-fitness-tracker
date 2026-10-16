import { defineConfig } from '@playwright/test';

const PORT = 3100;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env['CI'] ? 1 : 0,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // Installed Chrome locally; CI installs it with `playwright install chrome`.
    channel: 'chrome',
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node .output/server/index.mjs',
    url: `http://127.0.0.1:${PORT}/today`,
    reuseExistingServer: !process.env['CI'],
    env: {
      HOST: '127.0.0.1',
      PORT: String(PORT),
      API_INTERNAL_URL: 'http://127.0.0.1:3901',
    },
  },
});
