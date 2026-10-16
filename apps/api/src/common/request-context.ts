import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import { type NextFunction, type Request, type Response } from 'express';

export interface RequestContextData {
  requestId: string;
  ip?: string;
  deviceId?: string;
  actorUserId?: string;
  organizationId?: string;
}

const storage = new AsyncLocalStorage<RequestContextData>();

export const RequestContext = {
  run<T>(data: RequestContextData, fn: () => T): T {
    return storage.run(data, fn);
  },
  get(): RequestContextData | undefined {
    return storage.getStore();
  },
};

const REQUEST_ID_HEADER = 'x-request-id';
const DEVICE_ID_HEADER = 'x-device-id';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.header(REQUEST_ID_HEADER);
    const requestId = incoming && /^[\w-]{1,64}$/.test(incoming) ? incoming : randomUUID();
    res.setHeader(REQUEST_ID_HEADER, requestId);
    const ctx: RequestContextData = { requestId };
    if (req.ip) ctx.ip = req.ip;
    const deviceId = req.header(DEVICE_ID_HEADER);
    if (deviceId) ctx.deviceId = deviceId.slice(0, 64);
    RequestContext.run(ctx, next);
  }
}
