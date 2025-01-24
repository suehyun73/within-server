import { BulkOperationContainer } from '@elastic/elasticsearch/lib/api/types';
import { Injectable } from '@nestjs/common';
import { ElasticsearchService as EsService } from '@nestjs/elasticsearch';
import { Memo } from 'src/domain/entity/memo';
import { Id } from 'src/domain/vo/id';
import { Markdown } from 'src/domain/vo/markdown';
import { Pos } from 'src/domain/vo/pos';
import { Q } from 'src/domain/vo/q';
import { Timestamp } from 'src/domain/vo/timestamp';
import { Url } from 'src/domain/vo/url';
import { MemoDocRepoPort } from 'src/port/out/doc/memo.doc.repo.port';

@Injectable()
export class MemoDocRepo implements MemoDocRepoPort {
  private readonly MEMO_INDEX = 'memo';

  constructor(private readonly esService: EsService) {}

  async onModuleInit() {
    await this.esService.ping();

    if (!(await this.isMemoIndexExist())) {
      await this.createMemoIndex();
    }
  }

  private async isMemoIndexExist(): Promise<boolean> {
    return await this.esService.indices.exists({
      index: this.MEMO_INDEX,
    });
  }

  private async createMemoIndex(): Promise<void> {
    await this.esService.indices.create({
      index: this.MEMO_INDEX,
      body: {
        settings: {
          analysis: {
            analyzer: {
              korean: {
                type: 'nori',
              },
            },
          },
        },
        mappings: {
          properties: {
            memo: {
              properties: {
                localId: { type: 'keyword' },
                userId: { type: 'keyword' },
                targetUrl: { type: 'text' },
                markdown: { type: 'text', analyzer: 'korean' },
                pos: {
                  properties: {
                    x: { type: 'integer' },
                    y: { type: 'integer' },
                  },
                },
                scope: { type: 'keyword' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
                deletedAt: { type: 'date' },
              },
            },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
          },
        },
      },
    });
  }

  async searchMemos(
    q: Q,
    userId: Id,
  ): Promise<
    {
      id: Id;
      targetUrl: Url;
      pos: Pos;
      markdown: Markdown;
      createdAt: Timestamp;
      updatedAt: Timestamp;
    }[]
  > {
    const res = await this.esService.search({
      index: this.MEMO_INDEX,
      query: {
        bool: {
          must: [
            { match: { 'memo.userId': userId.value } },
            { match: { 'memo.markdown': q.value } },
          ],
          must_not: [{ exists: { field: 'memo.deletedAt' } }],
        },
      },
    });

    return res.hits.hits.map((hit: any) => ({
      id: Id.create(parseInt(hit._id)),
      targetUrl: Url.create(hit._source.memo.targetUrl),
      markdown: Markdown.create(hit._source.memo.markdown),
      pos: Pos.create(hit._source.memo.pos),
      createdAt: Timestamp.fromString(
        hit._source.memo.createdAt,
      ),
      updatedAt: Timestamp.fromString(
        hit._source.memo.updatedAt,
      ),
    }));
  }

  async bulkMemos(memos: Memo[]): Promise<void> {
    if (!memos.length) return;

    const operations = memos.flatMap<BulkOperationContainer>(
      (m) => [
        {
          index: {
            _index: this.MEMO_INDEX,
            _id: String(m.id!.value),
          },
        },
        {
          memo: {
            localId: m.localId.value,
            userId: m.userId.value,
            targetUrl: m.targetUrl.value,
            markdown: m.markdown.value,
            pos: m.pos.value,
            scope: m.scope.value,
            createdAt: m.createdAt!.value,
            updatedAt: m.updatedAt!.value,
            deletedAt: m.deletedAt?.value,
          },
          createdAt: Timestamp.now().value,
          updatedAt: Timestamp.now().value,
        },
      ],
    );

    await this.esService.bulk({
      body: operations,
      refresh: true,
    });

    return;
  }
}
