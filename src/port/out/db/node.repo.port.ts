import { Highlight } from 'src/domain/entity/highlight';
import { Memo } from 'src/domain/entity/memo';
import { Id } from 'src/domain/vo/id';
import { Timestamp } from 'src/domain/vo/timestamp';
import { Url } from 'src/domain/vo/url';
import { Db } from 'src/shared/type/db.type';

export const NODE_REPO = Symbol('NODE_REPO');

export interface NodeRepoPort {
  upsertMemos(memos: Memo[], db?: Db): Promise<Memo[]>;

  upsertHighlights(
    highlights: Highlight[],
    db?: Db,
  ): Promise<Highlight[]>;

  findMemosHighlights(): {
    byTargetUrlUserId(
      targetUrl: Url,
      userId: Id,
      db?: Db,
    ): Promise<{
      memos: Memo[];
      highlights: Highlight[];
    }>;
  };

  findMemos(): {
    byTargetUrlUserId(
      targetUrl: Url,
      userId: Id,
      db?: Db,
    ): Promise<Memo[]>;
    byIds(ids: Id[], db?: Db): Promise<Memo[]>;
  };

  findMemosWithDeletedAt(): {
    byMarkdownUpdatedBetween(
      from: Timestamp,
      to: Timestamp,
      db?: Db,
    ): Promise<Memo[]>;
  };

  findHighlights(): {
    byTargetUrlUserId(
      targetUrl: Url,
      userId: Id,
      db?: Db,
    ): Promise<Highlight[]>;
    byIds(ids: Id[], db?: Db): Promise<Highlight[]>;
  };

  findHighlightsWithDeletedAt(): {
    byUpdatedBetween(
      from: Timestamp,
      to: Timestamp,
      db?: Db,
    ): Promise<Highlight[]>;
  };

  deleteMemos(): {
    byIds(ids: Id[], db?: Db): Promise<void>;
  };

  deleteHighlights(): {
    byIds(ids: Id[], db?: Db): Promise<void>;
  };
}
