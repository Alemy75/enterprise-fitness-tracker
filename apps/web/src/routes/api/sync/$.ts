import { createFileRoute } from '@tanstack/react-router';
import { proxyToApi } from '../../../server/api-proxy';

/**
 * Stable same-origin URL for the outbox and Background Sync (ADR-19).
 * Session check and token injection: EFT-141.
 */
export const Route = createFileRoute('/api/sync/$')({
  server: {
    handlers: {
      GET: ({ request, params }) => proxyToApi(request, `/sync/${params._splat ?? ''}`),
      POST: ({ request, params }) => proxyToApi(request, `/sync/${params._splat ?? ''}`),
    },
  },
});
