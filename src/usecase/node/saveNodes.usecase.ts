import { Inject, Injectable } from '@nestjs/common';
import { Builder } from 'builder-pattern';
import { Highlight } from 'src/domain/entity/highlight';
import { Memo } from 'src/domain/entity/memo';
import { LocalId } from 'src/domain/vo/localId';
import { Markdown } from 'src/domain/vo/markdown';
import { Pos } from 'src/domain/vo/pos';
import { Scope } from 'src/domain/vo/scope';
import { Selector } from 'src/domain/vo/selector';
import { Span } from 'src/domain/vo/span';
import { Url } from 'src/domain/vo/url';
import {
  SaveNodesDtoIn,
  SaveNodesDtoOut,
  SaveNodesUsecasePort,
} from 'src/port/in/node/saveNodes.usecase.port';
import {
  DB_SERVICE,
  DbServicePort,
} from 'src/port/out/db/db.service.port';
import {
  NODE_DB_REPO,
  NodeDbRepoPort,
} from 'src/port/out/db/node.db.repo.port';

@Injectable()
export class SaveNodesUsecase implements SaveNodesUsecasePort {
  constructor(
    @Inject(DB_SERVICE)
    private readonly dbService: DbServicePort,
    @Inject(NODE_DB_REPO)
    private readonly nodeDbRepo: NodeDbRepoPort,
  ) {}

  async execute(
    dto: SaveNodesDtoIn,
    client: Client,
  ): Promise<SaveNodesDtoOut> {
    // dto를 엔티티로 변환
    const url = Url.create(dto.url);

    const incomingMemos = dto.memos.map((m) =>
      Builder(Memo)
        .localId(LocalId.create(m.localId))
        .userId(client.id)
        .targetUrl(url)
        .markdown(Markdown.create(m.markdown))
        .scope(Scope.create(m.scope))
        .pos(Pos.create(m.pos))
        .build(),
    );

    const incomingHighlights = dto.highlights.map((h) =>
      Builder(Highlight)
        .userId(client.id)
        .targetUrl(url)
        .selector(Selector.create(h.selector))
        .spans(h.spans.map((span) => Span.create(span)))
        .build()
        // span에서 겹치는 부분 병합 처리
        .mergeSpans(),
    );

    // 기존 데이터 조회
    const {
      memos: existingMemos,
      highlights: existingHighlights,
    } = await this.nodeDbRepo
      .findMemosHighlights()
      .byTargetUrlUserId(url, client.id);

    // 삭제할 node id와 highlight id 추출
    const memoIdsToDelete = this.getMemoIdsToDelete(
      existingMemos,
      incomingMemos,
    );
    const highlightIdsToDelete = this.getHighlightIdsToDelete(
      existingHighlights,
      incomingHighlights,
    );

    // 변경사항이 있거나 새롭게 추가된 memo와 highlight만 추출
    const memosToUpsert = this.getMemosToUpsert(
      existingMemos,
      incomingMemos,
    );
    const highlightsToUpsert = this.getHighlightsToUpsert(
      existingHighlights,
      incomingHighlights,
    );

    // 트랜잭션 처리
    await this.dbService.transaction(async (tx) => {
      // 삭제 작업들을 병렬로 처리
      await Promise.all([
        memoIdsToDelete.length > 0
          ? this.nodeDbRepo
              .deleteMemos()
              .byIds(memoIdsToDelete, tx)
          : Promise.resolve(),
        highlightIdsToDelete.length > 0
          ? this.nodeDbRepo
              .deleteHighlights()
              .byIds(highlightIdsToDelete, tx)
          : Promise.resolve(),
      ]);

      // upsert 작업들을 병렬로 처리
      await Promise.all([
        memosToUpsert.length > 0
          ? this.nodeDbRepo.upsertMemos(memosToUpsert, tx)
          : Promise.resolve(),
        highlightsToUpsert.length > 0
          ? this.nodeDbRepo.upsertHighlights(
              highlightsToUpsert,
              tx,
            )
          : Promise.resolve(),
      ]);
    });

    return Builder(SaveNodesDtoOut).build();
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

  private getMemosToUpsert(
    existingMemos: Memo[],
    incomingMemos: Memo[],
  ) {
    return incomingMemos.filter((incomingMemo) => {
      const existingMemo = existingMemos.find(
        (m) => m.localId.value === incomingMemo.localId.value,
      );

      // 새로운 memo는 포함
      if (!existingMemo) return true;

      // 기존 memo와 비교하여 변경사항이 있는지 확인
      return (
        existingMemo.markdown.value !==
          incomingMemo.markdown.value ||
        existingMemo.scope.value !== incomingMemo.scope.value ||
        existingMemo.pos.value.x !== incomingMemo.pos.value.x ||
        existingMemo.pos.value.y !== incomingMemo.pos.value.y
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

  private getMemoIdsToDelete(
    existingMemos: Memo[],
    incomingMemos: Memo[],
  ) {
    return existingMemos
      .filter(
        (existingMemo) =>
          !incomingMemos.some(
            (incomingMemo) =>
              incomingMemo.localId.value ===
              existingMemo.localId.value,
          ),
      )
      .map((m) => m.id!);
  }
}
