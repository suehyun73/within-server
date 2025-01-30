import { Highlight } from 'src/domain/entity/highlight';
import { Memo } from 'src/domain/entity/memo';
import { Id } from 'src/domain/vo/id';
import { Cursor } from 'src/domain/vo/cursor';
import { Q } from 'src/domain/vo/q';
import { Limit } from 'src/domain/vo/limit';
import { Span } from 'src/domain/vo/span';
import { Markdown } from 'src/domain/vo/markdown';

export const NODE_SEARCH_REPO = Symbol('NODE_SEARCH_REPO');

export interface NodeSearchRepoPort {
  searchNodes(
    q: Q,
    userId: Id,
    cursor: Cursor,
    limit: Limit,
  ): Promise<
    (
      | {
          type: 'memo';
          entity: Memo;
          markdownWithTag: Markdown;
          score: number;
        }
      | {
          type: 'highlight';
          entity: Highlight;
          spansWithTag: Span[];
          score: number;
        }
    )[]
  >;

  batchMemos(memos: Memo[], batchSize: number): Promise<void>;

  batchHighlights(
    highlights: Highlight[],
    batchSize: number,
  ): Promise<void>;
}
