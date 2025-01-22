import { Highlight } from 'src/domain/entity/highlight';
import { Node } from 'src/domain/entity/node';
import { Id } from 'src/domain/vo/id';
import { Timestamp } from 'src/domain/vo/timestamp';
import { Url } from 'src/domain/vo/url';
import { Db } from 'src/shared/type/db.type';

export const LAYOUT_REPO = Symbol('LAYOUT_REPO');

export interface LayoutRepoPort {
  upsertNodes(nodes: Node[], db?: Db): Promise<Node[]>;

  upsertHighlights(
    highlights: Highlight[],
    db?: Db,
  ): Promise<Highlight[]>;

  findNodesHighlights(): {
    byTargetUrlUserId(
      targetUrl: Url,
      userId: Id,
      db?: Db,
    ): Promise<{
      nodes: Node[];
      highlights: Highlight[];
    }>;
  };

  findNodes(): {
    byTargetUrlUserId(
      targetUrl: Url,
      userId: Id,
      db?: Db,
    ): Promise<Node[]>;
    byIds(ids: Id[], db?: Db): Promise<Node[]>;
    byMarkdownUpdatedBetween(
      from: Timestamp,
      to: Timestamp,
      db?: Db,
    ): Promise<Node[]>;
  };

  findHighlights(): {
    byTargetUrlUserId(
      targetUrl: Url,
      userId: Id,
      db?: Db,
    ): Promise<Highlight[]>;
    byIds(ids: Id[], db?: Db): Promise<Highlight[]>;
    bySpansUpdatedBetween(
      from: Timestamp,
      to: Timestamp,
      db?: Db,
    ): Promise<Highlight[]>;
  };

  deleteNodes(): {
    byIds(ids: Id[], db?: Db): Promise<void>;
  };

  deleteHighlights(): {
    byIds(ids: Id[], db?: Db): Promise<void>;
  };
}
