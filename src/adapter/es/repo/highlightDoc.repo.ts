import { BulkOperationContainer } from '@elastic/elasticsearch/lib/api/types';
import { Injectable } from '@nestjs/common';
import { ElasticsearchService as EsService } from '@nestjs/elasticsearch';
import { Highlight } from 'src/domain/entity/highlight';
import { Timestamp } from 'src/domain/vo/timestamp';
import { Id } from 'src/domain/vo/id';
import { Url } from 'src/domain/vo/url';
import { Span } from 'src/domain/vo/span';
import { HighlightDocRepoPort } from 'src/port/out/es/highlightDoc.repo.port';
import { Q } from 'src/domain/vo/q';
import { Selector } from 'src/domain/vo/selector';

@Injectable()
export class HighlightDocRepo implements HighlightDocRepoPort {
  private readonly HIGHLIGHT_INDEX = 'highlight';

  constructor(private readonly esService: EsService) {}

  async onModuleInit() {
    await this.esService.ping();

    if (!(await this.isHighlightIndexExist())) {
      await this.createHighlightIndex();
    }
  }

  private async isHighlightIndexExist(): Promise<boolean> {
    return await this.esService.indices.exists({
      index: this.HIGHLIGHT_INDEX,
    });
  }

  private async createHighlightIndex(): Promise<void> {
    await this.esService.indices.create({
      index: this.HIGHLIGHT_INDEX,
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
            highlight: {
              properties: {
                userId: { type: 'keyword' },
                targetUrl: { type: 'text' },
                selector: { type: 'text' },
                spans: {
                  type: 'nested',
                  properties: {
                    start: { type: 'integer' },
                    text: { type: 'text', analyzer: 'korean' },
                  },
                },
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

  async searchHighlights(
    q: Q,
    userId: Id,
  ): Promise<
    {
      id: Id;
      selector: Selector;
      targetUrl: Url;
      span: Span;
      createdAt: Timestamp;
      updatedAt: Timestamp;
    }[]
  > {
    const res = await this.esService.search({
      index: this.HIGHLIGHT_INDEX,
      query: {
        bool: {
          must: [
            { match: { 'highlight.userId': userId.value } },
            {
              nested: {
                path: 'highlight.spans',
                query: {
                  match: { 'highlight.spans.text': q.value },
                },
                inner_hits: {},
              },
            },
          ],
          must_not: [
            { exists: { field: 'highlight.deletedAt' } },
          ],
        },
      },
    });

    return res.hits.hits.flatMap((hit: any) =>
      hit.inner_hits['highlight.spans'].hits.hits.map(
        (innerHit) => ({
          id: Id.create(parseInt(hit._id)),
          selector: Selector.create(
            hit._source.highlight.selector,
          ),
          targetUrl: Url.create(hit._source.highlight.targetUrl),
          span: Span.create(innerHit._source),
          createdAt: Timestamp.fromString(
            hit._source.highlight.createdAt,
          ),
          updatedAt: Timestamp.fromString(
            hit._source.highlight.updatedAt,
          ),
        }),
      ),
    );
  }

  async bulkHighlights(highlights: Highlight[]): Promise<void> {
    if (!highlights.length) return;

    const operations =
      highlights.flatMap<BulkOperationContainer>((h) => [
        {
          index: {
            _index: this.HIGHLIGHT_INDEX,
            _id: String(h.id!.value),
          },
        },
        {
          highlight: {
            userId: h.userId.value,
            targetUrl: h.targetUrl.value,
            selector: h.selector.value,
            spans: h.spans!.map((span) => span.value),
            updatedAt: h.updatedAt!.value,
            createdAt: h.createdAt!.value,
            deletedAt: h.deletedAt?.value,
          },
          createdAt: Timestamp.now().value,
          updatedAt: Timestamp.now().value,
        },
      ]);

    await this.esService.bulk({
      body: operations,
      refresh: true,
    });

    return;
  }
}
