import { Inject, Injectable } from '@nestjs/common';
import { Builder } from 'builder-pattern';
import { DbService } from 'src/adapter/db/db.service';
import { Highlight } from 'src/domain/entity/highlight';
import { Node } from 'src/domain/entity/node';
import { LocalId } from 'src/domain/vo/localId';
import { Markdown } from 'src/domain/vo/markdown';
import { Pos } from 'src/domain/vo/pos';
import { Scope } from 'src/domain/vo/scope';
import { Selector } from 'src/domain/vo/selector';
import { Span } from 'src/domain/vo/span';
import { Url } from 'src/domain/vo/url';
import {
  SaveLayoutDtoIn,
  SaveLayoutDtoOut,
  SaveLayoutUsecasePort,
} from 'src/port/in/layout/saveLayout.usecase.port';
import {
  LAYOUT_REPO,
  LayoutRepoPort,
} from 'src/port/out/repo/layout.repo.port';

@Injectable()
export class SaveLayoutUsecase implements SaveLayoutUsecasePort {
  constructor(
    private readonly dbService: DbService,
    @Inject(LAYOUT_REPO)
    private readonly layoutRepo: LayoutRepoPort,
  ) {}

  async execute(
    dto: SaveLayoutDtoIn,
    client: Client,
  ): Promise<SaveLayoutDtoOut> {
    const url = Url.create(dto.url);

    // dto를 엔티티로 변환
    const incomingNodes = dto.nodes.map((node) =>
      Builder(Node)
        .localId(LocalId.create(node.localId))
        .userId(client.id)
        .targetUrl(url)
        .markdown(Markdown.create(node.markdown))
        .scope(Scope.create(node.scope))
        .pos(Pos.create(node.pos))
        .build(),
    );

    const incomingHighlights = dto.highlights.map((highlight) =>
      Builder(Highlight)
        .userId(client.id)
        .targetUrl(url)
        .selector(Selector.create(highlight.selector))
        .spans(highlight.spans.map((span) => Span.create(span)))
        .build(),
    );

    // 기존 데이터 조회
    const {
      nodes: existingNodes,
      highlights: existingHighlights,
    } = await this.layoutRepo
      .findNodesHighlights()
      .byTargetUrlUserId(url, client.id);

    // 삭제할 node id와 highlight id 추출
    const nodeIdsToDelete = existingNodes
      .filter(
        (existingNode) =>
          !incomingNodes.some(
            (incomingNode) =>
              incomingNode.localId.value ===
              existingNode.localId.value,
          ),
      )
      .map((node) => node.id!);

    const highlightIdsToDelete = existingHighlights
      .filter(
        (existingHighlight) =>
          !incomingHighlights.some(
            (incomingHighlight) =>
              incomingHighlight.selector.value ===
              existingHighlight.selector.value,
          ),
      )
      .map((highlight) => highlight.id!);

    // 트랜잭션 처리
    await this.dbService.transaction(async (tx) => {
      if (nodeIdsToDelete.length > 0) {
        await this.layoutRepo
          .deleteNodes()
          .byIds(nodeIdsToDelete, tx);
      }

      if (highlightIdsToDelete.length > 0) {
        await this.layoutRepo
          .deleteHighlights()
          .byIds(highlightIdsToDelete, tx);
      }

      await this.layoutRepo.upsertNodes(incomingNodes, tx);
      await this.layoutRepo.upsertHighlights(
        incomingHighlights,
        tx,
      );
    });

    return Builder(SaveLayoutDtoOut).build();
  }
}
