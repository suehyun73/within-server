import { Db } from 'src/shared/type/db.type';

export const DB_SERVICE = Symbol('DB_SERVICE');

export interface DbServicePort {
  getDb(): Db;

  transaction<T>(callback: (tx: Db) => Promise<T>): Promise<T>;
}
