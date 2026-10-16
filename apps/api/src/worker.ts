import 'reflect-metadata';
import { ConsoleLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { parseEnv } from './config/env.js';
import { WorkerModule } from './worker.module.js';

/** Same image as the API, started with `start:worker` (BACKLOG §9). */
async function bootstrap(): Promise<void> {
  const env = parseEnv();
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: new ConsoleLogger({ json: env.NODE_ENV === 'production', logLevels: [env.LOG_LEVEL] }),
  });
  app.enableShutdownHooks();
}

void bootstrap();
