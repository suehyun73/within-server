import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './orm/schema';
import { Pool } from 'pg';
import { Db } from 'src/shared/type/db.type';
import { DbServicePort } from 'src/port/out/db.service.port';

@Injectable()
export class DbService implements DbServicePort {
  private readonly pool: Pool;
  private readonly db: Db;

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

  getDb() {
    return this.db;
  }

  async transaction<T>(
    callback: (tx: Db) => Promise<T>,
  ): Promise<T> {
    const db = this.getDb();
    return await db.transaction(callback);
  }
}
