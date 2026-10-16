import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AuditModule } from './audit/audit.module.js';
import { ProblemDetailsFilter } from './common/problem-details.filter.js';
import { RequestContextMiddleware } from './common/request-context.js';
import { ConfigModule } from './config/config.module.js';
import { DbModule } from './db/db.module.js';
import { HealthController } from './health/health.controller.js';
import { OutboxModule } from './outbox/outbox.module.js';

/** Infrastructure shared by the API and the worker. */
@Module({
  imports: [ConfigModule, DbModule, AuditModule, OutboxModule],
  exports: [ConfigModule, DbModule, AuditModule, OutboxModule],
})
export class CoreModule {}

@Module({
  imports: [CoreModule],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: ProblemDetailsFilter }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*path');
  }
}
