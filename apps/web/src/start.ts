import { createStart } from '@tanstack/react-start';

/**
 * No server rendering of pages (ADR-19): the BFF answers every navigation with the
 * same app shell, which the service worker can replay offline. Server routes and
 * server functions are unaffected.
 */
export const startInstance = createStart(() => ({
  defaultSsr: false,
}));
