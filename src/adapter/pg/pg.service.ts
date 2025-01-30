import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './drizzle/schema';
import { Pool } from 'pg';
import { RdbInstance } from 'src/shared/type/rdbInstance.type';
import { RdbServicePort } from 'src/port/out/rdb/rdb.service.port';

@Injectable()
export class PgService implements RdbServicePort {
  private readonly pool: Pool;
  private readonly instance: RdbInstance;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      user: this.configService.getOrThrow('PG_USER'),
      password: this.configService.getOrThrow('PG_PW'),
      host: this.configService.getOrThrow('PG_HOST'),
      port: this.configService.getOrThrow('PG_PORT'),
      database: this.configService.getOrThrow('PG_DB'),
    });

    this.instance = drizzle(this.pool, { schema });
  }

  getInstance() {
    return this.instance;
  }

  async transaction<T>(
    callback: (tx: RdbInstance) => Promise<T>,
  ): Promise<T> {
    const instance = this.getInstance();
    return await instance.transaction(callback);
  }
}
