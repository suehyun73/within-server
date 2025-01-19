import { User } from 'src/domain/entity/user';
import { GoogleId } from 'src/domain/vo/googleId';
import { Id } from 'src/domain/vo/id';
import { Db } from 'src/shared/type/db.type';

export const USER_REPO = Symbol('USER_REPO');

export interface UserRepoPort {
  save(user: User, db?: Db): Promise<User>;

  findOneById(id: Id, db?: Db): Promise<User | undefined>;

  findOneByGoogleId(googleId: GoogleId, db?: Db): Promise<User | undefined>;

  deleteById(userId: Id, db?: Db): Promise<void>;
}
