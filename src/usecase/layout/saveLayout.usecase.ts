import { Inject, Injectable } from '@nestjs/common';
import { Builder } from 'builder-pattern';
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
  DB_SERVICE,
  DbServicePort,
} from 'src/port/out/db.service.port';
import {
  LAYOUT_REPO,
  LayoutRepoPort,
} from 'src/port/out/layout.repo.port';

@Injectable()
export class SaveLayoutUsecase implements SaveLayoutUsecasePort {
  constructor(
    @Inject(DB_SERVICE)
    private readonly dbService: DbServicePort,
    @Inject(LAYOUT_REPO)
    private readonly layoutRepo: LayoutRepoPort,
  ) {}

  async execute(
    dto: SaveLayoutDtoIn,
    client: Client,
  ): Promise<SaveLayoutDtoOut> {
    // dto를 엔티티로 변환
    const url = Url.create(dto.url);

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
        .build()
        // span에서 겹치는 부분 병합 처리
        .mergeSpans(),
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
      // 삭제 작업들을 병렬로 처리
      await Promise.all([
        nodeIdsToDelete.length > 0
          ? this.layoutRepo
              .deleteNodes()
              .byIds(nodeIdsToDelete, tx)
          : Promise.resolve(),
        highlightIdsToDelete.length > 0
          ? this.layoutRepo
              .deleteHighlights()
              .byIds(highlightIdsToDelete, tx)
          : Promise.resolve(),
      ]);

      // upsert 작업들을 병렬로 처리
      await Promise.all([
        this.layoutRepo.upsertNodes(incomingNodes, tx),
        this.layoutRepo.upsertHighlights(incomingHighlights, tx),
      ]);
    });

    return Builder(SaveLayoutDtoOut).build();
  }
}
