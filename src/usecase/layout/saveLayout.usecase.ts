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
    const nodeIdsToDelete = this.getNodeIdsToDelete(
      existingNodes,
      incomingNodes,
    );
    const highlightIdsToDelete = this.getHighlightIdsToDelete(
      existingHighlights,
      incomingHighlights,
    );

    // 변경사항이 있거나 새롭게 추가된 node와 highlight만 추출
    const nodesToUpsert = this.getNodesToUpsert(
      existingNodes,
      incomingNodes,
    );
    const highlightsToUpsert = this.getHighlightsToUpsert(
      existingHighlights,
      incomingHighlights,
    );

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
        nodesToUpsert.length > 0
          ? this.layoutRepo.upsertNodes(nodesToUpsert, tx)
          : Promise.resolve(),
        highlightsToUpsert.length > 0
          ? this.layoutRepo.upsertHighlights(
              highlightsToUpsert,
              tx,
            )
          : Promise.resolve(),
      ]);
    });

    return Builder(SaveLayoutDtoOut).build();
  }

  private getHighlightsToUpsert(
    existingHighlights: Highlight[],
    incomingHighlights: Highlight[],
  ) {
    return incomingHighlights.filter((incomingHighlight) => {
      const existingHighlight = existingHighlights.find(
        (highlight) =>
          highlight.selector.value ===
          incomingHighlight.selector.value,
      );

      // 새로운 highlight는 포함
      if (!existingHighlight) return true;

      // spans의 변경사항이 있는지 확인
      return (
        incomingHighlight.spans.length !==
          existingHighlight.spans.length ||
        incomingHighlight.spans.some((incomingSpan, index) => {
          const existingSpan = existingHighlight.spans[index];
          return (
            incomingSpan.value.start !==
              existingSpan.value.start ||
            incomingSpan.value.text !== existingSpan.value.text
          );
        })
      );
    });
  }

  private getNodesToUpsert(
    existingNodes: Node[],
    incomingNodes: Node[],
  ) {
    return incomingNodes.filter((incomingNode) => {
      const existingNode = existingNodes.find(
        (node) =>
          node.localId.value === incomingNode.localId.value,
      );

      // 새로운 node는 포함
      if (!existingNode) return true;

      // 기존 node와 비교하여 변경사항이 있는지 확인
      return (
        existingNode.markdown.value !==
          incomingNode.markdown.value ||
        existingNode.scope.value !== incomingNode.scope.value ||
        existingNode.pos.value.x !== incomingNode.pos.value.x ||
        existingNode.pos.value.y !== incomingNode.pos.value.y
      );
    });
  }

  private getHighlightIdsToDelete(
    existingHighlights: Highlight[],
    incomingHighlights: Highlight[],
  ) {
    return existingHighlights
      .filter(
        (existingHighlight) =>
          !incomingHighlights.some(
            (incomingHighlight) =>
              incomingHighlight.selector.value ===
              existingHighlight.selector.value,
          ),
      )
      .map((highlight) => highlight.id!);
  }

  private getNodeIdsToDelete(
    existingNodes: Node[],
    incomingNodes: Node[],
  ) {
    return existingNodes
      .filter(
        (existingNode) =>
          !incomingNodes.some(
            (incomingNode) =>
              incomingNode.localId.value ===
              existingNode.localId.value,
          ),
      )
      .map((node) => node.id!);
  }
}
