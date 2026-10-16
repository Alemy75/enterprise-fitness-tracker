import { Controller, Get, Inject, Res } from '@nestjs/common';
import { type HealthResponse } from '@eft/contracts';
import { sql } from 'drizzle-orm';
import { type Response } from 'express';
import { ENV } from '../config/config.module.js';
import { type Env } from '../config/env.js';
import { DB, type Db } from '../db/db.js';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(ENV) private readonly env: Env,
  ) {}

  /** Liveness: the process is up. */
  @Get('live')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  /** Readiness: dependencies answer. Load balancer stops routing on 503. */
  @Get('ready')
  async ready(@Res({ passthrough: true }) res: Response): Promise<HealthResponse> {
    const started = performance.now();
    let database: HealthResponse['checks'][string];
    try {
      await this.db.execute(sql`select 1`);
      database = { status: 'ok', latencyMs: Math.round(performance.now() - started) };
    } catch {
      database = { status: 'down', error: 'database unreachable' };
    }
    const status = database.status === 'ok' ? 'ok' : 'down';
    if (status !== 'ok') res.status(503);
    return { status, version: this.env.APP_VERSION, checks: { database } };
  }
}
