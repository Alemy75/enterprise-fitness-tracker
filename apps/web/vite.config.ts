import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import { serviceWorkerPlugin } from './vite/service-worker-plugin.ts';

// ADR-19: client-rendered app (`defaultSsr: false` in src/start.ts) served by the Start
// BFF on Node. The service worker precaches the shell so the app opens without network.
export default defineConfig({
  // IPv4 loopback explicitly: `localhost` → `::1` is blocked on some Windows machines.
  server: { host: '127.0.0.1', port: Number(process.env['WEB_PORT'] ?? 3000) },
  plugins: [tanstackStart(), nitro(), viteReact(), serviceWorkerPlugin()],
});
