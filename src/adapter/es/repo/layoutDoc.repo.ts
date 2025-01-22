import { BulkOperationContainer } from '@elastic/elasticsearch/lib/api/types';
import { Injectable } from '@nestjs/common';
import { ElasticsearchService as EsService } from '@nestjs/elasticsearch';
import { Node } from 'src/domain/entity/node';
import { Highlight } from 'src/domain/entity/highlight';
import { LayoutDocRepoPort } from 'src/port/out/layoutDoc.repo.port';
import { Timestamp } from 'src/domain/vo/timestamp';

@Injectable()
export class LayoutDocRepo implements LayoutDocRepoPort {
  private readonly NODE_INDEX = 'node';
  private readonly HIGHLIGHT_INDEX = 'highlight';

  constructor(private readonly esService: EsService) {}

  async onModuleInit() {
    await this.esService.ping();

    if (!(await this.isNodeIndexExist())) {
      await this.createNodeIndex();
    }
    if (!(await this.isHighlightIndexExist())) {
      await this.createHighlightIndex();
    }
  }

  private async isNodeIndexExist(): Promise<boolean> {
    return await this.esService.indices.exists({
      index: this.NODE_INDEX,
    });
  }

  private async createNodeIndex(): Promise<void> {
    await this.esService.indices.create({
      index: this.NODE_INDEX,
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
            userId: { type: 'keyword' },
            markdown: { type: 'text', analyzer: 'korean' },
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },
      },
    });
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
            userId: { type: 'keyword' },
            spans: { type: 'text', analyzer: 'korean' }, // [text, text, ...]와 같은 형태
            created_at: { type: 'date' },
            updated_at: { type: 'date' },
          },
        },
      },
    });
  }

  async bulkNodes(nodes: Node[]): Promise<void> {
    if (!nodes.length) return;

    const operations = nodes.flatMap<BulkOperationContainer>(
      (node) => [
        {
          index: {
            _index: this.NODE_INDEX,
            _id: String(node.id?.value),
          },
        },
        {
          markdown: node.markdown!.value,
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

  async bulkHighlights(highlights: Highlight[]): Promise<void> {
    if (!highlights.length) return;

    const operations =
      highlights.flatMap<BulkOperationContainer>((highlight) => [
        {
          index: {
            _index: this.HIGHLIGHT_INDEX,
            _id: String(highlight.id!.value),
          },
        },
        {
          spans: highlight.spans!.map((span) => span.value.text),
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
