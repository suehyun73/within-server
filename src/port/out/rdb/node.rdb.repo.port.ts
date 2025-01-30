import { Highlight } from 'src/domain/entity/highlight';
import { Memo } from 'src/domain/entity/memo';
import { Id } from 'src/domain/vo/id';
import { Timestamp } from 'src/domain/vo/timestamp';
import { Url } from 'src/domain/vo/url';
import { RdbInstance } from 'src/shared/type/rdbInstance.type';

export const NODE_RDB_REPO = Symbol('NODE_RDB_REPO');

export interface NodeRdbRepoPort {
  upsertMemos(
    memos: Memo[],
    instance?: RdbInstance,
  ): Promise<Memo[]>;

  upsertHighlights(
    highlights: Highlight[],
    instance?: RdbInstance,
  ): Promise<Highlight[]>;

  findNodes(): {
    byTargetUrlUserId(
      targetUrl: Url,
      userId: Id,
      instance?: RdbInstance,
    ): Promise<{
      memos: Memo[];
      highlights: Highlight[];
    }>;
  };

  findNodesIncludedDeleted(): {
    betweenUpdatedAt(
      from: Timestamp,
      to: Timestamp,
      instance?: RdbInstance,
    ): Promise<{
      memos: Memo[];
      highlights: Highlight[];
    }>;
  };

  findMemos(): {
    byTargetUrlUserId(
      targetUrl: Url,
      userId: Id,
      instance?: RdbInstance,
    ): Promise<Memo[]>;

    byIds(ids: Id[], db?: RdbInstance): Promise<Memo[]>;
  };

  findHighlights(): {
    byTargetUrlUserId(
      targetUrl: Url,
      userId: Id,
      instance?: RdbInstance,
    ): Promise<Highlight[]>;

    byIds(ids: Id[], db?: RdbInstance): Promise<Highlight[]>;
  };

  deleteMemos(): {
    byIds(ids: Id[], db?: RdbInstance): Promise<void>;
  };

  deleteHighlights(): {
    byIds(ids: Id[], db?: RdbInstance): Promise<void>;
  };
}
