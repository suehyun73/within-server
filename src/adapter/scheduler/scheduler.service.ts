import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Timestamp } from 'src/domain/vo/timestamp';
import {
  LAYOUT_DOC_REPO,
  LayoutDocRepoPort,
} from 'src/port/out/layoutDoc.repo.port';
import {
  LAYOUT_REPO,
  LayoutRepoPort,
} from 'src/port/out/layout.repo.port';

@Injectable()
export class SchedulerService {
  private readonly SYNC_INTERVAL_MS = 10 * 1000;

  constructor(
    private readonly configService: ConfigService,
    @Inject(LAYOUT_REPO)
    private readonly layoutRepo: LayoutRepoPort,
    @Inject(LAYOUT_DOC_REPO)
    private readonly layoutDocRepo: LayoutDocRepoPort,
  ) {}

  private getLastSyncedAt(
    type: 'node' | 'highlight',
  ): Timestamp {
    const saved = this.configService.get(`${type}.lastSyncedAt`);
    return saved
      ? Timestamp.create(new Date(saved))
      : Timestamp.create(
          new Date(Date.now() - this.SYNC_INTERVAL_MS),
        );
  }

  private saveLastSyncedAt(
    timestamp: Timestamp,
    type: 'node' | 'highlight',
  ): void {
    this.configService.set(
      `${type}.lastSyncedAt`,
      timestamp.value.toISOString(),
    );
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async syncNodes() {
    const from = this.getLastSyncedAt('node');
    const to = Timestamp.now();

    const updatedNodes = await this.layoutRepo
      .findNodes()
      .byMarkdownUpdatedBetween(from, to);

    if (updatedNodes.length > 0) {
      await this.layoutDocRepo.bulkNodes(updatedNodes);
    }

    this.saveLastSyncedAt(to, 'node');
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async syncHighlights() {
    const from = this.getLastSyncedAt('highlight');
    const to = Timestamp.now();

    const updatedHighlights = await this.layoutRepo
      .findHighlights()
      .bySpansUpdatedBetween(from, to);

    if (updatedHighlights.length > 0) {
      await this.layoutDocRepo.bulkHighlights(updatedHighlights);
    }

    this.saveLastSyncedAt(to, 'highlight');
  }
}
