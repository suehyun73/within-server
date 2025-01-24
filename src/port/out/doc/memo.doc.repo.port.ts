import { Memo } from 'src/domain/entity/memo';
import { Id } from 'src/domain/vo/id';
import { Markdown } from 'src/domain/vo/markdown';
import { Pos } from 'src/domain/vo/pos';
import { Q } from 'src/domain/vo/q';
import { Timestamp } from 'src/domain/vo/timestamp';
import { Url } from 'src/domain/vo/url';

export const MEMO_DOC_REPO = Symbol('MEMO_DOC_REPO');

export interface MemoDocRepoPort {
  bulkMemos(memo: Memo[]): Promise<void>;

  searchMemos(
    q: Q,
    userId: Id,
  ): Promise<
    {
      id: Id;
      targetUrl: Url;
      pos: Pos;
      markdown: Markdown;
      createdAt: Timestamp;
      updatedAt: Timestamp;
    }[]
  >;
}
