import { Highlight } from 'src/domain/entity/highlight';
import { Memo } from 'src/domain/entity/memo';
import { Id } from 'src/domain/vo/id';
import { Q } from 'src/domain/vo/q';

export const NODE_SEARCH_REPO = Symbol('NODE_SEARCH_REPO');

export interface NodeSearchRepoPort {
  searchNodes(
    q: Q,
    userId: Id,
  ): Promise<{ memos: Memo[]; highlights: Highlight[] }>;

  batchMemos(memos: Memo[]): Promise<void>;

  batchHighlights(highlights: Highlight[]): Promise<void>;
}
