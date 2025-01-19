import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/adapter/db/orm/schema';

export type Tx = NodePgDatabase<typeof schema>;
