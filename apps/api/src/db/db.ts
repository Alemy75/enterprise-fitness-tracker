import { type ExtractTablesWithRelations } from 'drizzle-orm';
import { type PgDatabase, type PgQueryResultHKT, type PgTransaction } from 'drizzle-orm/pg-core';
import * as schema from './schema/index.js';

export { schema };

/**
 * Driver-agnostic database handle: postgres.js in the app, PGlite in tests.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export type Tx = PgTransaction<PgQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>;

/** Anything that can run queries: the root handle or an open transaction. */
export type DbOrTx = Db | Tx;

export const DB = Symbol('DB');
