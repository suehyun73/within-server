import { Highlight } from 'src/domain/entity/highlight';
import { Memo } from 'src/domain/entity/memo';
import { Id } from 'src/domain/vo/id';
import { Cursor } from 'src/domain/vo/cursor';
import { Q } from 'src/domain/vo/q';

export const NODE_SEARCH_REPO = Symbol('NODE_SEARCH_REPO');

export interface NodeSearchRepoPort {
  searchNodes(
    q: Q,
    userId: Id,
    cursor: Cursor,
    limit: number,
  ): Promise<
    (
      | { score: number; type: 'memo'; entity: Memo }
      | { score: number; type: 'highlight'; entity: Highlight }
    )[]
  >;

  batchMemos(memos: Memo[], batchSize: number): Promise<void>;

  batchHighlights(
    highlights: Highlight[],
    batchSize: number,
  ): Promise<void>;
}
