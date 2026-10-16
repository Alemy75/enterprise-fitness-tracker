import { z } from 'zod';

export const HealthStatus = z.enum(['ok', 'degraded', 'down']);

export const HealthResponse = z.object({
  status: HealthStatus,
  version: z.string(),
  checks: z.record(
    z.string(),
    z.object({
      status: HealthStatus,
      latencyMs: z.number().optional(),
      error: z.string().optional(),
    }),
  ),
});
export type HealthResponse = z.infer<typeof HealthResponse>;
