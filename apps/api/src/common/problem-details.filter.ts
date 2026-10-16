import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { type ProblemDetails } from '@eft/contracts';
import { type Request, type Response } from 'express';
import { ZodError } from 'zod';
import { RequestContext } from './request-context.js';

const PROBLEM_TYPE_BASE = 'https://errors.eft.local/';

/** Maps every error to an RFC 7807 body. Internal details never leave the server. */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const res = http.getResponse<Response>();
    const req = http.getRequest<Request>();
    const problem = this.toProblem(exception);
    problem.instance = req.originalUrl;

    if (problem.status >= 500) {
      this.logger.error(
        { requestId: RequestContext.get()?.requestId, path: req.originalUrl },
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res.status(problem.status).type('application/problem+json').json(problem);
  }

  private toProblem(exception: unknown): ProblemDetails {
    if (exception instanceof ZodError) {
      return {
        type: `${PROBLEM_TYPE_BASE}validation`,
        title: 'Validation failed',
        status: HttpStatus.BAD_REQUEST,
        errors: exception.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const detail =
        typeof body === 'string'
          ? body
          : typeof body === 'object' && body !== null && 'message' in body
            ? String((body as { message: unknown }).message)
            : undefined;
      return {
        type: `${PROBLEM_TYPE_BASE}${status}`,
        title: HttpStatus[status]?.toString().toLowerCase().replaceAll('_', ' ') ?? 'error',
        status,
        ...(detail && detail !== exception.name ? { detail } : {}),
      };
    }
    return {
      type: `${PROBLEM_TYPE_BASE}internal`,
      title: 'Internal server error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }
}
