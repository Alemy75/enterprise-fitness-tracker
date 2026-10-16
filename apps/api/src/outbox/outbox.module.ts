import { Global, Module } from '@nestjs/common';
import { OutboxHandlerRegistry } from './outbox-handlers.js';
import { OutboxRelay } from './outbox-relay.js';
import { OutboxService } from './outbox.service.js';

/** Imported by both processes: the API writes events, modules register handlers. */
@Global()
@Module({
  providers: [OutboxService, OutboxHandlerRegistry],
  exports: [OutboxService, OutboxHandlerRegistry],
})
export class OutboxModule {}

/** Worker-only: polls and dispatches. */
@Module({
  providers: [OutboxRelay],
  exports: [OutboxRelay],
})
export class OutboxRelayModule {}
