import { randomUUID } from 'node:crypto';
import { type Plugin } from 'vite';
import { generateSW } from 'workbox-build';

/**
 * Generates the service worker right after the client bundle is written (EFT-140).
 *
 * It must run inside the client build: Nitro snapshots `.output/public` into its static
 * asset table when the server is built, so files added after `vite build` return 404.
 *
 * Offline navigation: with `defaultSsr: false` the server answers every page with the same
 * app shell, so the precached `/` serves as the fallback for any route.
 * API calls are never cached: offline data comes from IndexedDB in the app.
 */
export function serviceWorkerPlugin(): Plugin {
  return {
    name: 'eft:service-worker',
    apply: 'build',
    applyToEnvironment: (environment) => environment.name === 'client',
    async writeBundle(options) {
      const dir = options.dir;
      if (!dir) throw new Error('Client output directory is unknown');
      const { count, size, warnings } = await generateSW({
        globDirectory: dir,
        globPatterns: ['**/*.{js,css,svg,png,webp,woff2,webmanifest}'],
        globIgnores: ['sw.js', 'workbox-*.js'],
        additionalManifestEntries: [{ url: '/', revision: randomUUID() }],
        swDest: `${dir}/sw.js`,
        navigateFallback: '/',
        navigateFallbackDenylist: [/^\/api\//, /^\/_serverFn\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        sourcemap: false,
        mode: 'production',
      });
      for (const warning of warnings) this.warn(warning);
      this.info(`service worker: precached ${count} files, ${(size / 1024).toFixed(1)} KiB`);
    },
  };
}
