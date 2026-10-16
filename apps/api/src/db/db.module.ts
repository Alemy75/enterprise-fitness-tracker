import { Global, Inject, Injectable, Module, type OnApplicationShutdown } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { ENV } from '../config/config.module.js';
import { type Env } from '../config/env.js';
import { DB, schema, type Db } from './db.js';

const SQL_CLIENT = Symbol('SQL_CLIENT');

@Injectable()
class SqlClientShutdown implements OnApplicationShutdown {
  constructor(@Inject(SQL_CLIENT) private readonly client: postgres.Sql) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.end({ timeout: 5 });
  }
}

@Global()
@Module({
  providers: [
    {
      provide: SQL_CLIENT,
      inject: [ENV],
      useFactory: (env: Env) => postgres(env.DATABASE_URL, { max: env.DATABASE_POOL_MAX }),
    },
    {
      provide: DB,
      inject: [SQL_CLIENT],
      useFactory: (client: postgres.Sql): Db => drizzle({ client, schema, casing: 'snake_case' }),
    },
    SqlClientShutdown,
  ],
  exports: [DB],
})
export class DbModule {}
