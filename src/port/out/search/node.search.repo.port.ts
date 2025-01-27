import { Highlight } from 'src/domain/entity/highlight';
import { Memo } from 'src/domain/entity/memo';
import { Q } from 'src/domain/vo/q';
import { RdbInstance } from 'src/shared/type/rdbInstance.type';

export const NODE_SEARCH_REPO = Symbol('NODE_SEARCH_REPO');

export interface NodeSearchRepoPort {
  searchNodes(
    q: Q,
    instance?: RdbInstance,
  ): Promise<{ memos: Memo[]; highlights: Highlight[] }>;
}
