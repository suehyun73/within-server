import { Injectable } from '@nestjs/common';
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
import { Node } from 'src/domain/entity/node';
import { Id } from 'src/domain/vo/id';
import { LocalId } from 'src/domain/vo/localId';
import { Markdown } from 'src/domain/vo/markdown';
import { Pos } from 'src/domain/vo/pos';
import { Scope } from 'src/domain/vo/scope';
import { Timestamp } from 'src/domain/vo/timestamp';
import { Url } from 'src/domain/vo/url';
import { LayoutRepoPort } from 'src/port/out/repo/layout.repo.port';
import { DbService } from '../db.service';
import {
  highlightTable,
  nodeTable,
  userTable,
} from '../orm/schema';
import { Highlight } from 'src/domain/entity/highlight';
import { Selector } from 'src/domain/vo/selector';
import { Span } from 'src/domain/vo/span';

@Injectable()
export class LayoutRepo implements LayoutRepoPort {
  constructor(private readonly dbService: DbService) {}

  async upsertNodes(
    nodes: Node[],
    db = this.dbService.getDb(),
  ): Promise<Node[]> {
    const rows = await db
      .insert(nodeTable)
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
          nodeTable.localId,
          nodeTable.userId,
          nodeTable.targetUrl,
        ],
        targetWhere: isNull(nodeTable.deletedAt),
        set: {
          markdown: sql`excluded.markdown`,
          posX: sql`excluded.pos_x`,
          posY: sql`excluded.pos_y`,
          scope: sql`excluded.scope`,
        },
      })
      .returning();

    return this.mapToNodes(rows);
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

  findNodesHighlights() {
    return {
      byTargetUrlUserId: async (
        targetUrl: Url,
        userId: Id,
        db = this.dbService.getDb(),
      ): Promise<{ nodes: Node[]; highlights: Highlight[] }> => {
        const result = await db.query.userTable.findFirst({
          with: {
            nodes: {
              where: or(
                and(
                  eq(nodeTable.targetUrl, targetUrl.value),
                  isNull(nodeTable.deletedAt),
                ),
                and(
                  eq(
                    nodeTable.domain,
                    targetUrl.extract().domain,
                  ),
                  eq(nodeTable.scope, 'domain'),
                  isNull(nodeTable.deletedAt),
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
          return { nodes: [], highlights: [] };
        }

        return {
          nodes: this.mapToNodes(result.nodes),
          highlights: this.mapToHighlights(result.highlights),
        };
      },
    };
  }

  findNodes() {
    return {
      byTargetUrlUserId: async (
        targetUrl: Url,
        userId: Id,
        db = this.dbService.getDb(),
      ): Promise<Node[]> => {
        const rows = await db.query.nodeTable.findMany({
          where: and(
            eq(nodeTable.targetUrl, targetUrl.value),
            eq(nodeTable.userId, userId.value),
            isNull(nodeTable.deletedAt),
          ),
        });

        return this.mapToNodes(rows);
      },
      byIds: async (
        ids: Id[],
        db = this.dbService.getDb(),
      ): Promise<Node[]> => {
        const rows = await db.query.nodeTable.findMany({
          where: and(
            inArray(
              nodeTable.id,
              ids.map((id) => id.value),
            ),
            isNull(nodeTable.deletedAt),
          ),
        });

        return this.mapToNodes(rows);
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

  deleteNodes() {
    return {
      byIds: async (
        ids: Id[],
        db = this.dbService.getDb(),
      ): Promise<void> => {
        await db
          .update(nodeTable)
          .set({ deletedAt: Timestamp.now().value })
          .where(
            and(
              inArray(
                nodeTable.id,
                ids.map((id) => id.value),
              ),
              isNull(nodeTable.deletedAt),
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

  private mapToNodes(
    rows: InferSelectModel<typeof nodeTable>[],
  ): Node[] {
    return rows.map((row) =>
      Builder(Node)
        .id(Id.create(row.id))
        .localId(LocalId.create(row.localId))
        .userId(Id.create(row.userId))
        .targetUrl(Url.create(row.targetUrl))
        .markdown(Markdown.create(row.markdown))
        .pos(Pos.create({ x: row.posX, y: row.posY }))
        .scope(Scope.create(row.scope))
        .createdAt(Timestamp.create(row.createdAt))
        .updatedAt(Timestamp.create(row.updatedAt))
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
        .build(),
    );
  }
}
