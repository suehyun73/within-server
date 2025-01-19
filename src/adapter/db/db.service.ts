import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './orm/schema';
import { Pool } from 'pg';
import { Tx } from 'src/shared/type/db.type';

@Injectable()
export class DbService {
  private readonly pool: Pool;
  private readonly db: Tx;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      user: this.configService.getOrThrow('PG_USER'),
      password: this.configService.getOrThrow('PG_PW'),
      host: 'pg',
      port: 5432,
      database: this.configService.getOrThrow('PG_DB'),
    });

    this.db = drizzle(this.pool, { schema });

    this.db = drizzle({ schema, client: this.pool });
  }

  getInstance() {
    return this.db;
  }

  async transaction<T>(callback: (tx: Tx) => Promise<T>): Promise<T> {
    const db = this.getInstance();
    return await db.transaction(callback);
  }
}
