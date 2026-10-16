import { type PipeTransform } from '@nestjs/common';
import { type z } from 'zod';

/**
 * Validates a request part against a schema from `@eft/contracts`.
 * Throws ZodError, which ProblemDetailsFilter turns into a 400.
 */
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform<unknown, z.infer<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    return this.schema.parse(value);
  }
}
