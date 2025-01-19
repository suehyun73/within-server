import { User } from 'src/domain/entity/user';
import { GoogleId } from 'src/domain/vo/googleId';
import { Id } from 'src/domain/vo/id';
import { Tx } from 'src/shared/type/db.type';

export const USER_REPO = Symbol('USER_REPO');

export interface UserRepoPort {
  save(user: User, tx?: Tx): Promise<User>;

  findOneByUserId(userId: Id, tx?: Tx): Promise<User | undefined>;

  findOneByGoogleId(googleId: GoogleId, tx?: Tx): Promise<User | undefined>;

  deleteByUserId(userId: Id, tx?: Tx): Promise<void>;
}
