import { RdbInstance } from 'src/shared/type/rdbInstance.type';

export const RDB_SERVICE = Symbol('RDB_SERVICE');

export interface RdbServicePort {
  getInstance(): RdbInstance;

  transaction<T>(
    callback: (instance: RdbInstance) => Promise<T>,
  ): Promise<T>;
}
