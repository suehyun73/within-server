import { Inject, Injectable } from '@nestjs/common';
import { Builder } from 'builder-pattern';
import {
  and,
  between,
  eq,
  inArray,
  InferSelectModel,
  isNull,
  or,
  sql,
} from 'drizzle-orm';
import { Memo } from 'src/domain/entity/memo';
import { Id } from 'src/domain/vo/id';
import { LocalId } from 'src/domain/vo/localId';
import { Markdown } from 'src/domain/vo/markdown';
import { Pos } from 'src/domain/vo/pos';
import { Scope } from 'src/domain/vo/scope';
import { Timestamp } from 'src/domain/vo/timestamp';
import { Url } from 'src/domain/vo/url';
import { NodeRepoPort } from 'src/port/out/db/node.repo.port';
import {
  highlightTable,
  memoTable,
  userTable,
} from '../orm/schema';
import { Highlight } from 'src/domain/entity/highlight';
import { Selector } from 'src/domain/vo/selector';
import { Span } from 'src/domain/vo/span';
import {
  DB_SERVICE,
  DbServicePort,
} from 'src/port/out/db/db.service.port';

@Injectable()
export class NodeRepo implements NodeRepoPort {
  constructor(
    @Inject(DB_SERVICE)
    private readonly dbService: DbServicePort,
  ) {}

  async upsertMemos(
    nodes: Memo[],
    db = this.dbService.getDb(),
  ): Promise<Memo[]> {
    const rows = await db
      .insert(memoTable)
      .values(
        nodes.map((node) => ({
          localId: node.localId.value,
          userId: node.userId.value,
          targetUrl: node.targetUrl.value,
          domain: node.targetUrl.extract().domain,
          markdown: node.markdown.value,
          posX: node.pos.value.x,
          posY: node.pos.value.y,
          scope: node.scope.value,
        })),
      )
      .onConflictDoUpdate({
        target: [
          memoTable.localId,
          memoTable.userId,
          memoTable.targetUrl,
        ],
        targetWhere: isNull(memoTable.deletedAt),
        set: {
          markdown: sql`excluded.markdown`,
          posX: sql`excluded.pos_x`,
          posY: sql`excluded.pos_y`,
          scope: sql`excluded.scope`,
          markdownUpdatedAt: sql`
            CASE
              WHEN excluded.markdown <> ${memoTable.markdown} THEN CURRENT_TIMESTAMP
              ELSE ${memoTable.markdownUpdatedAt}
            END
          `,
        },
      })
      .returning();

    return this.mapToMemos(rows);
  }

  async upsertHighlights(
    highlights: Highlight[],
    db = this.dbService.getDb(),
  ): Promise<Highlight[]> {
    const rows = await db
      .insert(highlightTable)
      .values(
        highlights.map((highlight) => ({
          userId: highlight.userId.value,
          targetUrl: highlight.targetUrl.value,
          selector: highlight.selector.value,
          spans: highlight.spans.map((span) => span.value),
        })),
      )
      .onConflictDoUpdate({
        target: [
          highlightTable.userId,
          highlightTable.targetUrl,
          highlightTable.selector,
        ],
        targetWhere: isNull(highlightTable.deletedAt),
        set: {
          spans: sql`excluded.spans`,
        },
      })
      .returning();

    return this.mapToHighlights(rows);
  }

  findMemosHighlights() {
    return {
      byTargetUrlUserId: async (
        targetUrl: Url,
        userId: Id,
        db = this.dbService.getDb(),
      ): Promise<{ memos: Memo[]; highlights: Highlight[] }> => {
        const result = await db.query.userTable.findFirst({
          with: {
            memos: {
              where: or(
                and(
                  eq(memoTable.targetUrl, targetUrl.value),
                  isNull(memoTable.deletedAt),
                ),
                and(
                  eq(
                    memoTable.domain,
                    targetUrl.extract().domain,
                  ),
                  eq(memoTable.scope, 'domain'),
                  isNull(memoTable.deletedAt),
                ),
              ),
            },
            highlights: {
              where: and(
                eq(highlightTable.targetUrl, targetUrl.value),
                isNull(highlightTable.deletedAt),
              ),
            },
          },
          columns: {},
          where: and(
            eq(userTable.id, userId.value),
            isNull(userTable.deletedAt),
          ),
        });

        if (!result) {
          return { memos: [], highlights: [] };
        }

        return {
          memos: this.mapToMemos(result.memos),
          highlights: this.mapToHighlights(result.highlights),
        };
      },
    };
  }

  findMemos() {
    return {
      byTargetUrlUserId: async (
        targetUrl: Url,
        userId: Id,
        db = this.dbService.getDb(),
      ): Promise<Memo[]> => {
        const rows = await db.query.memoTable.findMany({
          where: and(
            eq(memoTable.targetUrl, targetUrl.value),
            eq(memoTable.userId, userId.value),
            isNull(memoTable.deletedAt),
          ),
        });

        return this.mapToMemos(rows);
      },
      byIds: async (
        ids: Id[],
        db = this.dbService.getDb(),
      ): Promise<Memo[]> => {
        const rows = await db.query.memoTable.findMany({
          where: and(
            inArray(
              memoTable.id,
              ids.map((id) => id.value),
            ),
            isNull(memoTable.deletedAt),
          ),
        });

        return this.mapToMemos(rows);
      },
    };
  }

  findMemosWithDeletedAt() {
    return {
      byMarkdownUpdatedBetween: async (
        from: Timestamp,
        to: Timestamp,
        db = this.dbService.getDb(),
      ): Promise<Memo[]> => {
        const rows = await db.query.memoTable.findMany({
          where: and(
            between(
              memoTable.markdownUpdatedAt,
              from.value,
              to.value,
            ),
          ),
        });

        return this.mapToMemos(rows);
      },
    };
  }

  findHighlights() {
    return {
      byTargetUrlUserId: async (
        targetUrl: Url,
        userId: Id,
        db = this.dbService.getDb(),
      ): Promise<Highlight[]> => {
        const rows = await db.query.highlightTable.findMany({
          where: and(
            eq(highlightTable.targetUrl, targetUrl.value),
            eq(highlightTable.userId, userId.value),
            isNull(highlightTable.deletedAt),
          ),
        });

        return this.mapToHighlights(rows);
      },
      byIds: async (
        ids: Id[],
        db = this.dbService.getDb(),
      ): Promise<Highlight[]> => {
        const rows = await db.query.highlightTable.findMany({
          where: and(
            inArray(
              highlightTable.id,
              ids.map((id) => id.value),
            ),
            isNull(highlightTable.deletedAt),
          ),
        });

        return this.mapToHighlights(rows);
      },
    };
  }

  findHighlightsWithDeletedAt() {
    return {
      byUpdatedBetween: async (
        from: Timestamp,
        to: Timestamp,
        db = this.dbService.getDb(),
      ): Promise<Highlight[]> => {
        const rows = await db.query.highlightTable.findMany({
          where: and(
            between(
              highlightTable.updatedAt,
              from.value,
              to.value,
            ),
          ),
        });

        return this.mapToHighlights(rows);
      },
    };
  }

  deleteMemos() {
    return {
      byIds: async (
        ids: Id[],
        db = this.dbService.getDb(),
      ): Promise<void> => {
        await db
          .update(memoTable)
          .set({ deletedAt: Timestamp.now().value })
          .where(
            and(
              inArray(
                memoTable.id,
                ids.map((id) => id.value),
              ),
              isNull(memoTable.deletedAt),
            ),
          );
      },
    };
  }

  deleteHighlights() {
    return {
      byIds: async (
        ids: Id[],
        db = this.dbService.getDb(),
      ): Promise<void> => {
        await db
          .update(highlightTable)
          .set({ deletedAt: Timestamp.now().value })
          .where(
            and(
              inArray(
                highlightTable.id,
                ids.map((id) => id.value),
              ),
              isNull(highlightTable.deletedAt),
            ),
          );
      },
    };
  }

  private mapToMemos(
    rows: InferSelectModel<typeof memoTable>[],
  ): Memo[] {
    return rows.map((row) =>
      Builder(Memo)
        .id(Id.create(row.id))
        .localId(LocalId.create(row.localId))
        .userId(Id.create(row.userId))
        .targetUrl(Url.create(row.targetUrl))
        .markdown(Markdown.create(row.markdown))
        .pos(Pos.create({ x: row.posX, y: row.posY }))
        .scope(Scope.create(row.scope))
        .createdAt(Timestamp.create(row.createdAt))
        .updatedAt(Timestamp.create(row.updatedAt))
        .markdownUpdatedAt(
          Timestamp.create(row.markdownUpdatedAt),
        )
        .deletedAt(
          row.deletedAt
            ? Timestamp.create(row.deletedAt)
            : undefined,
        )
        .build(),
    );
  }

  private mapToHighlights(
    rows: InferSelectModel<typeof highlightTable>[],
  ): Highlight[] {
    return rows.map((row) =>
      Builder(Highlight)
        .id(Id.create(row.id))
        .userId(Id.create(row.userId))
        .targetUrl(Url.create(row.targetUrl))
        .selector(Selector.create(row.selector))
        .spans(row.spans.map((span) => Span.create(span)))
        .createdAt(Timestamp.create(row.createdAt))
        .updatedAt(Timestamp.create(row.updatedAt))
        .deletedAt(
          row.deletedAt
            ? Timestamp.create(row.deletedAt)
            : undefined,
        )
        .build(),
    );
  }
}
