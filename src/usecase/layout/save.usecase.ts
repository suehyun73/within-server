import { Inject, Injectable } from '@nestjs/common';
import { Builder } from 'builder-pattern';
import { DbService } from 'src/adapter/db/db.service';
import { Node } from 'src/domain/entity/node';
import { LocalId } from 'src/domain/vo/localId';
import { Md } from 'src/domain/vo/md';
import { Pos } from 'src/domain/vo/pos';
import { Scope } from 'src/domain/vo/scope';
import { Url } from 'src/domain/vo/url';
import {
  SaveDtoIn,
  SaveDtoOut,
  SaveUsecasePort,
} from 'src/port/in/layout/save.usecase.port';
import { NODE_REPO, NodeRepoPort } from 'src/port/out/repo/node.repo.port';

@Injectable()
export class SaveUsecase implements SaveUsecasePort {
  constructor(
    private readonly dbService: DbService,
    @Inject(NODE_REPO) private readonly nodeRepo: NodeRepoPort,
  ) {}
  async exec(dto: SaveDtoIn, client: Client): Promise<SaveDtoOut> {
    const targetUrl = Url.create(dto.url);
    const newNodes = dto.nodes.map((node) =>
      Builder(Node)
        .localId(LocalId.create(node.localId))
        .userId(client.id)
        .targetUrl(targetUrl)
        .md(Md.create(node.md))
        .scope(Scope.create(node.scope))
        .pos(Pos.create(node.pos))
        .build(),
    );

    // 저장되어있는 노드들과 비교하여 없어진 nodeId들 추출
    const oldNodes = await this.nodeRepo.findManyByTargetUrlUserId(
      targetUrl,
      client.id,
    );
    const nodeIdsToDelete = oldNodes
      .filter(
        (oldNode) =>
          !newNodes.some(
            (newNode) => newNode.localId.value === oldNode.localId!.value,
          ),
      )
      .map((node) => node.id!);

    await this.dbService.transaction(async (tx) => {
      if (nodeIdsToDelete.length > 0) {
        await this.nodeRepo.deleteManyByNodeIds(nodeIdsToDelete, tx); // 안쓰는 노드들 삭제
      }

      await this.nodeRepo.upsertMany(newNodes, tx); // 없으면 추가, 있으면 업데이트
    });

    return Builder(SaveDtoOut).build();
  }
}
