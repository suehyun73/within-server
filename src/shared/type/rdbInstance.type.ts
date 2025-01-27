import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/adapter/pg/drizzle/schema';

export type RdbInstance = NodePgDatabase<typeof schema>;
