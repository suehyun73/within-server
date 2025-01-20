import { Highlight } from 'src/domain/entity/highlight';
import { Node } from 'src/domain/entity/node';
import { Id } from 'src/domain/vo/id';
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
    ): Promise<Node[]>; // 수정
    byIds(ids: Id[], db?: Db): Promise<Node[]>; // 수정
  };

  findHighlights(): {
    byTargetUrlUserId(
      targetUrl: Url,
      userId: Id,
      db?: Db,
    ): Promise<Highlight[]>; // 수정
    byIds(ids: Id[], db?: Db): Promise<Highlight[]>; // 수정
  };

  deleteNodes(): {
    byIds(ids: Id[], db?: Db): Promise<void>; // 수정
  };

  deleteHighlights(): {
    byIds(ids: Id[], db?: Db): Promise<void>; // 수정
  };
}
