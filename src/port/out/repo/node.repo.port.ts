import { Node } from 'src/domain/entity/node';
import { Id } from 'src/domain/vo/id';
import { Url } from 'src/domain/vo/url';
import { Db } from 'src/shared/type/db.type';

export const NODE_REPO = Symbol('NODE_REPO');

export interface NodeRepoPort {
  upsertMany(nodes: Node[], db?: Db): Promise<Node[]>;

  findManyByTargetUrlUserId(targetUrl: Url, userId: Id, db?: Db): Promise<Node[]>;

  deleteManyByIds(nodeIds: Id[], db?: Db): Promise<void>;
}
