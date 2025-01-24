import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/adapter/pg/orm/schema';

export type Db = NodePgDatabase<typeof schema>;
