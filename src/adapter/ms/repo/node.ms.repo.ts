import { Injectable, OnModuleInit } from '@nestjs/common';
import { Highlight } from 'src/domain/entity/highlight';
import { Memo } from 'src/domain/entity/memo';
import { Id } from 'src/domain/vo/id';
import { Q } from 'src/domain/vo/q';
import { NodeSearchRepoPort } from 'src/port/out/search/node.search.repo.port';
import { MsService } from '../ms.service';
import { Builder } from 'builder-pattern';
import { LocalId } from 'src/domain/vo/localId';
import { Url } from 'src/domain/vo/url';
import { Markdown } from 'src/domain/vo/markdown';
import { Pos } from 'src/domain/vo/pos';
import { Scope } from 'src/domain/vo/scope';
import { Timestamp } from 'src/domain/vo/timestamp';
import { Selector } from 'src/domain/vo/selector';
import { Span } from 'src/domain/vo/span';
import { Meilisearch as MsInstance } from 'meilisearch';
import { MS_CONST } from '../ms.const';
import { Cursor } from 'src/domain/vo/cursor';
import { Limit } from 'src/domain/vo/limit';

@Injectable()
export class NodeMsRepo
  implements NodeSearchRepoPort, OnModuleInit
{
  constructor(private readonly msService: MsService) {}

  async onModuleInit() {
    const instance = this.msService.getInstance();

    await Promise.all([
      (await this.isMemoIndexExist(instance))
        ? Promise.resolve()
        : this.createMemoIndex(instance),
      (await this.isHighlightIndexExist(instance))
        ? Promise.resolve()
        : this.createHighlightIndex(instance),
    ]);
  }

  private async isMemoIndexExist(instance: MsInstance) {
    try {
      await instance.getIndex(MS_CONST.INDEX.MEMO);
      return true;
    } catch {
      return false;
    }
  }

  private async isHighlightIndexExist(instance: MsInstance) {
    try {
      await instance.getIndex(MS_CONST.INDEX.HIGHLIGHT);
      return true;
    } catch {
      return false;
    }
  }

  private async createMemoIndex(instance: MsInstance) {
    await instance.createIndex(MS_CONST.INDEX.MEMO, {
      primaryKey: 'id',
    });
    await instance.index(MS_CONST.INDEX.MEMO).updateSettings({
      searchableAttributes: ['markdown'],
      filterableAttributes: ['userId', 'deletedAt'],
    });
  }

  private async createHighlightIndex(instance: MsInstance) {
    await instance.createIndex(MS_CONST.INDEX.HIGHLIGHT, {
      primaryKey: 'id',
    });
    await instance
      .index(MS_CONST.INDEX.HIGHLIGHT)
      .updateSettings({
        searchableAttributes: ['spans.text'],
        filterableAttributes: ['userId', 'deletedAt'],
      });
  }

  async searchNodes(
    q: Q,
    userId: Id,
    cursor: Cursor,
    limit: Limit,
  ): Promise<
    (
      | {
          type: 'memo';
          entity: Memo;
          markdownWithTag: Markdown;
          score: number;
        }
      | {
          type: 'highlight';
          entity: Highlight;
          spansWithTag: Span[];
          score: number;
        }
    )[]
  > {
    const instance = this.msService.getInstance();

    const [memoResult, highlightResult] = (
      await instance.multiSearch({
        queries: [
          {
            indexUid: MS_CONST.INDEX.MEMO,
            q: q.value,
            filter: [
              `userId = ${userId.value}`,
              'deletedAt IS NULL',
            ],
            attributesToHighlight: ['markdown'],
            highlightPreTag: MS_CONST.HIT_PRE_TAG,
            highlightPostTag: MS_CONST.HIT_POST_TAG,
            showRankingScore: true,
            rankingScoreThreshold: MS_CONST.MIN_SCORE,
            limit: limit.value,
            offset: cursor.value * limit.value,
          },
          {
            indexUid: MS_CONST.INDEX.HIGHLIGHT,
            q: q.value,
            filter: [
              `userId = ${userId.value}`,
              'deletedAt IS NULL',
            ],
            attributesToHighlight: ['spans.text'],
            highlightPreTag: MS_CONST.HIT_PRE_TAG,
            highlightPostTag: MS_CONST.HIT_POST_TAG,
            rankingScoreThreshold: MS_CONST.MIN_SCORE,
            showRankingScore: true,
            limit: limit.value,
            offset: cursor.value * limit.value,
          },
        ],
      })
    ).results;

    const formatScore = (score: number) =>
      Number(score.toFixed(2));
    const createSpan = (span: { text: string; start: number }) =>
      Span.create({
        text: span.text,
        start: Number(span.start),
      });

    return [
      ...memoResult.hits.map((hit) => ({
        type: 'memo' as const,
        entity: this.mapToMemo(hit),
        markdownWithTag: Markdown.create(
          hit._formatted!.markdown,
        ),
        score: formatScore(hit._rankingScore!),
      })),
      ...highlightResult.hits.map((hit) => {
        return {
          type: 'highlight' as const,
          entity: this.mapToHighlight(hit),
          spansWithTag: hit
            ._formatted!.spans.filter((span) =>
              span.text.includes(MS_CONST.HIT_PRE_TAG),
            )
            .map(createSpan),
          score: formatScore(hit._rankingScore!),
        };
      }),
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit.value);
  }

  async batchMemos(
    memos: Memo[],
    batchSize: number,
  ): Promise<void> {
    if (!memos.length) return;

    const memoIndex = this.msService
      .getInstance()
      .index(MS_CONST.INDEX.MEMO);

    await memoIndex.addDocumentsInBatches(
      memos.map((memo) => ({
        id: String(memo.id!.value),
        localId: memo.localId.value,
        userId: memo.userId.value,
        targetUrl: memo.targetUrl.value,
        markdown: memo.markdown.value,
        scope: memo.scope.value,
        posX: memo.pos.value.x,
        posY: memo.pos.value.y,
        createdAt: memo.createdAt!.value,
        updatedAt: memo.updatedAt!.value,
        deletedAt: memo.deletedAt?.value || null,
      })),
      batchSize,
    );
  }

  async batchHighlights(
    highlights: Highlight[],
    batchSize: number,
  ): Promise<void> {
    if (!highlights.length) return;

    const highlightIndex = this.msService
      .getInstance()
      .index(MS_CONST.INDEX.HIGHLIGHT);

    await highlightIndex.addDocumentsInBatches(
      highlights.map((highlight) => ({
        id: String(highlight.id!.value),
        userId: highlight.userId.value,
        targetUrl: highlight.targetUrl.value,
        selector: highlight.selector.value,
        spans: highlight.spans.map((span) => span.value),
        createdAt: highlight.createdAt!.value,
        updatedAt: highlight.updatedAt!.value,
        deletedAt: highlight.deletedAt?.value || null,
      })),
      batchSize,
    );
  }

  private mapToMemo(row: any): Memo {
    return Builder(Memo)
      .id(Id.create(Number(row.id)))
      .localId(LocalId.create(row.localId))
      .userId(Id.create(Number(row.userId)))
      .targetUrl(Url.create(row.targetUrl))
      .markdown(Markdown.create(row.markdown))
      .pos(
        Pos.create({
          x: Number(row.posX),
          y: Number(row.posY),
        }),
      )
      .scope(Scope.create(row.scope))
      .createdAt(Timestamp.fromString(row.createdAt))
      .updatedAt(Timestamp.fromString(row.updatedAt))
      .deletedAt(
        row.deletedAt
          ? Timestamp.fromString(row.deletedAt)
          : undefined,
      )
      .build();
  }

  private mapToHighlight(row: any): Highlight {
    return Builder(Highlight)
      .id(Id.create(Number(row.id)))
      .userId(Id.create(Number(row.userId)))
      .targetUrl(Url.create(row.targetUrl))
      .selector(Selector.create(row.selector))
      .spans(
        row.spans.map((span) =>
          Span.create({
            text: span.text,
            start: Number(span.start),
          }),
        ),
      )
      .createdAt(Timestamp.fromString(row.createdAt))
      .updatedAt(Timestamp.fromString(row.updatedAt))
      .deletedAt(
        row.deletedAt
          ? Timestamp.fromString(row.deletedAt)
          : undefined,
      )
      .build();
  }
}
