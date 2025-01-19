import { Node } from 'src/domain/entity/node';
import { Id } from 'src/domain/vo/id';
import { Url } from 'src/domain/vo/url';
import { Tx } from 'src/shared/type/db.type';

export const NODE_REPO = Symbol('NODE_REPO');

export interface NodeRepoPort {
  upsertMany(nodes: Node[], tx?: Tx): Promise<Node[]>;

  findManyByTargetUrlUserId(targetUrl: Url, userId: Id, tx?: Tx): Promise<Node[]>;

  deleteManyByNodeIds(nodeIds: Id[], tx?: Tx): Promise<void>;
}
