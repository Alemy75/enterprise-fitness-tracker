import { Module } from '@nestjs/common';
import { CoreModule } from './app.module.js';
import { OutboxRelayModule } from './outbox/outbox.module.js';

@Module({
  imports: [CoreModule, OutboxRelayModule],
})
export class WorkerModule {}
