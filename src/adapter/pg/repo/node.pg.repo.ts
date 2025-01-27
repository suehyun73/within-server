import { Inject, Injectable } from '@nestjs/common';
import { Builder } from 'builder-pattern';
import {
  and,
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
import { NodeRdbRepoPort } from 'src/port/out/rdb/node.rdb.repo.port';
import { Highlight } from 'src/domain/entity/highlight';
import { Selector } from 'src/domain/vo/selector';
import { Span } from 'src/domain/vo/span';
import * as schema from '../orm/schema';
import {
  RDB_SERVICE,
  RdbServicePort,
} from 'src/port/out/rdb/rdb.service.port';
import { NodeSearchRepoPort } from 'src/port/out/search/node.search.repo.port';
import { Q } from 'src/domain/vo/q';

@Injectable()
export class NodePgRepo
  implements NodeRdbRepoPort, NodeSearchRepoPort
{
  constructor(
    @Inject(RDB_SERVICE)
    private readonly rdbService: RdbServicePort,
  ) {}

  async searchNodes(
    q: Q,
    instance = this.rdbService.getInstance(),
  ): Promise<{ memos: Memo[]; highlights: Highlight[] }> {
    const rows = await instance.execute(sql``);

    console.log(rows);

    throw new Error('Method not implemented.');
  }

  async upsertMemos(
    nodes: Memo[],
    instance = this.rdbService.getInstance(),
  ): Promise<Memo[]> {
    const rows = await instance
      .insert(schema.memos)
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
          schema.memos.localId,
          schema.memos.userId,
          schema.memos.targetUrl,
        ],
        targetWhere: isNull(schema.memos.deletedAt),
        set: {
          markdown: sql`excluded.markdown`,
          posX: sql`excluded.pos_x`,
          posY: sql`excluded.pos_y`,
          scope: sql`excluded.scope`,
        },
      })
      .returning();

    return this.mapToMemos(rows);
  }

  async upsertHighlights(
    highlights: Highlight[],
    instance = this.rdbService.getInstance(),
  ): Promise<Highlight[]> {
    const rows = await instance
      .insert(schema.highlights)
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
          schema.highlights.userId,
          schema.highlights.targetUrl,
          schema.highlights.selector,
        ],
        targetWhere: isNull(schema.highlights.deletedAt),
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
        instance = this.rdbService.getInstance(),
      ): Promise<{ memos: Memo[]; highlights: Highlight[] }> => {
        const result = await instance.query.users.findFirst({
          with: {
            memos: {
              where: or(
                and(
                  eq(schema.memos.targetUrl, targetUrl.value),
                  isNull(schema.memos.deletedAt),
                ),
                and(
                  eq(
                    schema.memos.domain,
                    targetUrl.extract().domain,
                  ),
                  eq(schema.memos.scope, 'domain'),
                  isNull(schema.memos.deletedAt),
                ),
              ),
            },
            highlights: {
              where: and(
                eq(schema.highlights.targetUrl, targetUrl.value),
                isNull(schema.highlights.deletedAt),
              ),
            },
          },
          columns: {},
          where: and(
            eq(schema.users.id, userId.value),
            isNull(schema.users.deletedAt),
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
        instance = this.rdbService.getInstance(),
      ): Promise<Memo[]> => {
        const rows = await instance.query.memos.findMany({
          where: and(
            eq(schema.memos.targetUrl, targetUrl.value),
            eq(schema.memos.userId, userId.value),
            isNull(schema.memos.deletedAt),
          ),
        });

        return this.mapToMemos(rows);
      },
      byIds: async (
        ids: Id[],
        instance = this.rdbService.getInstance(),
      ): Promise<Memo[]> => {
        const rows = await instance.query.memos.findMany({
          where: and(
            inArray(
              schema.memos.id,
              ids.map((id) => id.value),
            ),
            isNull(schema.memos.deletedAt),
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
        instance = this.rdbService.getInstance(),
      ): Promise<Highlight[]> => {
        const rows = await instance.query.highlights.findMany({
          where: and(
            eq(schema.highlights.targetUrl, targetUrl.value),
            eq(schema.highlights.userId, userId.value),
            isNull(schema.highlights.deletedAt),
          ),
        });

        return this.mapToHighlights(rows);
      },
      byIds: async (
        ids: Id[],
        instance = this.rdbService.getInstance(),
      ): Promise<Highlight[]> => {
        const rows = await instance.query.highlights.findMany({
          where: and(
            inArray(
              schema.highlights.id,
              ids.map((id) => id.value),
            ),
            isNull(schema.highlights.deletedAt),
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
        instance = this.rdbService.getInstance(),
      ): Promise<void> => {
        await instance
          .update(schema.memos)
          .set({ deletedAt: Timestamp.now().value })
          .where(
            and(
              inArray(
                schema.memos.id,
                ids.map((id) => id.value),
              ),
              isNull(schema.memos.deletedAt),
            ),
          );
      },
    };
  }

  deleteHighlights() {
    return {
      byIds: async (
        ids: Id[],
        instance = this.rdbService.getInstance(),
      ): Promise<void> => {
        await instance
          .update(schema.highlights)
          .set({ deletedAt: Timestamp.now().value })
          .where(
            and(
              inArray(
                schema.highlights.id,
                ids.map((id) => id.value),
              ),
              isNull(schema.highlights.deletedAt),
            ),
          );
      },
    };
  }

  private mapToMemos(
    rows: InferSelectModel<typeof schema.memos>[],
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
        .deletedAt(
          row.deletedAt
            ? Timestamp.create(row.deletedAt)
            : undefined,
        )
        .build(),
    );
  }

  private mapToHighlights(
    rows: InferSelectModel<typeof schema.highlights>[],
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
