import { createFileRoute } from '@tanstack/react-router';
import { proxyToApi } from '../../server/api-proxy';

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: ({ request }) => proxyToApi(request, '/health/ready'),
    },
  },
});
