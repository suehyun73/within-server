import { Injectable } from '@nestjs/common';
import { Builder } from 'builder-pattern';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { Node } from 'src/domain/entity/node';
import { Id } from 'src/domain/vo/id';
import { LocalId } from 'src/domain/vo/localId';
import { Md } from 'src/domain/vo/md';
import { Pos } from 'src/domain/vo/pos';
import { Scope } from 'src/domain/vo/scope';
import { Timestamp } from 'src/domain/vo/timestamp';
import { Url } from 'src/domain/vo/url';
import { NodeRepoPort } from 'src/port/out/repo/node.repo.port';
import { DbService } from '../db.service';
import { nodeTable } from '../orm/schema';

@Injectable()
export class NodeRepo implements NodeRepoPort {
  constructor(private readonly dbService: DbService) {}

  async upsertMany(nodes: Node[], db = this.dbService.getDb()): Promise<Node[]> {
    const rows = await db
      .insert(nodeTable)
      .values(
        nodes.map((node) => ({
          localId: node.localId.value,
          userId: node.userId.value,
          targetUrl: node.targetUrl.value,
          domain: node.targetUrl.extract().domain,
          md: node.md.value,
          posX: node.pos.value.x,
          posY: node.pos.value.y,
          scope: node.scope.value,
        })),
      )
      .onConflictDoUpdate({
        target: [nodeTable.localId, nodeTable.userId, nodeTable.targetUrl],
        targetWhere: isNull(nodeTable.deletedAt), // 삭제되어지지 않은 node들 중에서 conflict 체크
        set: {
          md: sql`excluded.md`,
          posX: sql`excluded.pos_x`,
          posY: sql`excluded.pos_y`,
          scope: sql`excluded.scope`,
        },
      })
      .returning();

    return rows.map((row) =>
      Builder(Node)
        .id(Id.create(row.id))
        .localId(LocalId.create(row.localId))
        .userId(Id.create(row.userId))
        .targetUrl(Url.create(row.targetUrl))
        .md(Md.create(row.md))
        .pos(Pos.create({ x: row.posX, y: row.posY }))
        .scope(Scope.create(row.scope))
        .createdAt(Timestamp.create(row.createdAt))
        .updatedAt(Timestamp.create(row.updatedAt))
        .build(),
    );
  }

  async findManyByTargetUrlUserId(targetUrl: Url, userId: Id, tx = this.dbService.getDb()): Promise<Node[]> {
    const rows = await tx.query.nodeTable.findMany({
      columns: { deletedAt: false },
      where: and(
        eq(nodeTable.targetUrl, targetUrl.value),
        eq(nodeTable.userId, userId.value),
        isNull(nodeTable.deletedAt),
      ),
    });

    return rows.map((row) =>
      Builder(Node)
        .id(Id.create(row.id))
        .localId(LocalId.create(row.localId))
        .userId(Id.create(row.userId))
        .targetUrl(Url.create(row.targetUrl))
        .md(Md.create(row.md))
        .pos(Pos.create({ x: row.posX, y: row.posY }))
        .scope(Scope.create(row.scope))
        .createdAt(Timestamp.create(row.createdAt))
        .updatedAt(Timestamp.create(row.updatedAt))
        .build(),
    );
  }

  async deleteManyByIds(nodeIds: Id[], tx = this.dbService.getDb()): Promise<void> {
    await tx
      .update(nodeTable)
      .set({ deletedAt: Timestamp.now().value })
      .where(
        and(
          inArray(
            nodeTable.id,
            nodeIds.map((id) => id.value),
          ),
          isNull(nodeTable.deletedAt),
        ),
      );

    return;
  }
}
