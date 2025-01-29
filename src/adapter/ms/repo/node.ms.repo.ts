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

@Injectable()
export class NodeMsRepo
  implements NodeSearchRepoPort, OnModuleInit
{
  private readonly MEMO_IDX = 'memos';
  private readonly HIGHLIGHT_IDX = 'highlights';
  private readonly BATCH_SIZE = 100;
  private readonly HIGHLIGHT_TAG = '<hit>';

  constructor(private readonly msService: MsService) {}

  async onModuleInit() {
    await this.createIndexes();
  }

  private async createIndexes() {
    const instance = this.msService.getInstance();

    await Promise.all([
      this.createMemoIndex(instance),
      this.createHighlightIndex(instance),
    ]);
  }

  private async createMemoIndex(instance: MsInstance) {
    await instance.createIndex(this.MEMO_IDX, {
      primaryKey: 'id',
    });

    await instance.index(this.MEMO_IDX).updateSettings({
      searchableAttributes: ['markdown'],
      filterableAttributes: ['userId', 'deletedAt'],
    });
  }

  private async createHighlightIndex(instance: MsInstance) {
    await instance.createIndex(this.HIGHLIGHT_IDX, {
      primaryKey: 'id',
    });

    await instance.index(this.HIGHLIGHT_IDX).updateSettings({
      searchableAttributes: ['spans.text'],
      filterableAttributes: ['userId', 'deletedAt', 'targetUrl'],
    });
  }

  async searchNodes(
    q: Q,
    userId: Id,
  ): Promise<{ memos: Memo[]; highlights: Highlight[] }> {
    const instance = this.msService.getInstance();

    const memoIdx = instance.index(this.MEMO_IDX);
    const highlightIdx = instance.index(this.HIGHLIGHT_IDX);

    const [memos, highlights] = await Promise.all([
      memoIdx.search(q.value, {
        filter: [
          `userId = ${userId.value}`,
          'deletedAt IS NULL',
        ],
        attributesToHighlight: ['markdown'],
        highlightPreTag: this.HIGHLIGHT_TAG,
        highlightPostTag: this.HIGHLIGHT_TAG.replace('<', '</'),
      }),
      highlightIdx.search(q.value, {
        filter: [
          `userId = ${userId.value}`,
          'deletedAt IS NULL',
        ],
        attributesToHighlight: ['spans.text'],
        highlightPreTag: this.HIGHLIGHT_TAG,
        highlightPostTag: this.HIGHLIGHT_TAG.replace('<', '</'),
      }),
    ]);

    return {
      memos: this.mapToMemos(
        memos.hits.map((hit) => hit._formatted),
      ),
      highlights: this.mapToHighlights(
        highlights.hits.map((hit) => ({
          ...hit._formatted,
          spans: hit._formatted!.spans.filter((span) =>
            span.text.includes(this.HIGHLIGHT_TAG),
          ),
        })),
      ),
    };
  }

  async batchMemos(memos: Memo[]): Promise<void> {
    if (!memos.length) return;

    const instance = this.msService.getInstance();
    const memoIdx = instance.index(this.MEMO_IDX);

    const docs = memos.map((memo) => ({
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
    }));

    await memoIdx.addDocumentsInBatches(docs, this.BATCH_SIZE);
  }

  async batchHighlights(highlights: Highlight[]): Promise<void> {
    if (!highlights.length) return;

    const instance = this.msService.getInstance();
    const highlightIdx = instance.index(this.HIGHLIGHT_IDX);

    const docs = highlights.map((highlight) => ({
      id: String(highlight.id!.value),
      userId: highlight.userId.value,
      targetUrl: highlight.targetUrl.value,
      selector: highlight.selector.value,
      spans: highlight.spans.map((span) => span.value),
      createdAt: highlight.createdAt!.value,
      updatedAt: highlight.updatedAt!.value,
      deletedAt: highlight.deletedAt?.value || null,
    }));

    await highlightIdx.addDocumentsInBatches(
      docs,
      this.BATCH_SIZE,
    );
  }

  private mapToMemos(rows: any): Memo[] {
    return rows.map((row) =>
      Builder(Memo)
        .id(Id.create(parseInt(row.id)))
        .localId(LocalId.create(row.localId))
        .userId(Id.create(parseInt(row.userId)))
        .targetUrl(Url.create(row.targetUrl))
        .markdown(Markdown.create(row.markdown))
        .pos(
          Pos.create({
            x: parseFloat(row.posX),
            y: parseFloat(row.posY),
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
        .build(),
    );
  }

  private mapToHighlights(rows: any): Highlight[] {
    return rows.map((row) =>
      Builder(Highlight)
        .id(Id.create(parseInt(row.id)))
        .userId(Id.create(parseInt(row.userId)))
        .targetUrl(Url.create(row.targetUrl))
        .selector(Selector.create(row.selector))
        .spans(
          row.spans.map((span) =>
            Span.create({
              text: span.text,
              start: parseInt(span.start),
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
        .build(),
    );
  }
}
