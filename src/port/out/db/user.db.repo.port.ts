import { User } from 'src/domain/entity/user';
import { GoogleId } from 'src/domain/vo/googleId';
import { Id } from 'src/domain/vo/id';
import { Db } from 'src/shared/type/db.type';

export const USER_DB_REPO = Symbol('USER_DB_REPO');

export interface UserDbRepoPort {
  saveUser(user: User, db?: Db): Promise<User>;

  findUser(): {
    byId(userId: Id, db?: Db): Promise<User | undefined>;
    byGoogleId(
      googleId: GoogleId,
      db?: Db,
    ): Promise<User | undefined>;
  };

  deleteUser(): {
    byId(userId: Id, db?: Db): Promise<void>;
  };
}
