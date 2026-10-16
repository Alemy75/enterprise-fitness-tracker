import 'reflect-metadata';
import { ConsoleLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { parseEnv } from './config/env.js';

async function bootstrap(): Promise<void> {
  const env = parseEnv();
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({ json: env.NODE_ENV === 'production', logLevels: [env.LOG_LEVEL] }),
  });
  // The API is reached only through the BFF (ADR-19); trust its X-Forwarded-For.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.enableShutdownHooks();
  await app.listen(env.API_PORT);
}

void bootstrap();
