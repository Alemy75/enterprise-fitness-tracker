import { z } from 'zod';

/** UUIDv7, generated on the client (ADR-11). */
export const Uuid = z.uuid({ version: 'v7' });
export type Uuid = z.infer<typeof Uuid>;

/** RFC 7807 error body returned by every API endpoint. */
export const ProblemDetails = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  errors: z
    .array(
      z.object({
        path: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
});
export type ProblemDetails = z.infer<typeof ProblemDetails>;

export const CursorPageQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type CursorPageQuery = z.infer<typeof CursorPageQuery>;

export const cursorPage = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
