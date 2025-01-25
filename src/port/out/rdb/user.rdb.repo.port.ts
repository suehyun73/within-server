import { User } from 'src/domain/entity/user';
import { GoogleId } from 'src/domain/vo/googleId';
import { Id } from 'src/domain/vo/id';
import { RdbInstance } from 'src/shared/type/rdbInstance.type';

export const USER_RDB_REPO = Symbol('USER_RDB_REPO');

export interface UserRdbRepoPort {
  saveUser(user: User, instance?: RdbInstance): Promise<User>;

  findUser(): {
    byId(
      userId: Id,
      instance?: RdbInstance,
    ): Promise<User | undefined>;
    byGoogleId(
      googleId: GoogleId,
      instance?: RdbInstance,
    ): Promise<User | undefined>;
  };

  deleteUser(): {
    byId(userId: Id, instance?: RdbInstance): Promise<void>;
  };
}
