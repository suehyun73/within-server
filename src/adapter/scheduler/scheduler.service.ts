import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Timestamp } from 'src/domain/vo/timestamp';
import {
  NODE_REPO,
  NodeRepoPort,
} from 'src/port/out/db/node.repo.port';
import {
  MEMO_DOC_REPO,
  MemoDocRepoPort,
} from 'src/port/out/es/memoDoc.repo.port';
import {
  HIGHLIGHT_DOC_REPO,
  HighlightDocRepoPort,
} from 'src/port/out/es/highlightDoc.repo.port';

type NodeType = 'memo' | 'highlight';

@Injectable()
export class SchedulerService {
  private readonly SYNC_INTERVAL_MS = 10 * 1000;

  constructor(
    private readonly configService: ConfigService,
    @Inject(NODE_REPO)
    private readonly nodeRepo: NodeRepoPort,
    @Inject(MEMO_DOC_REPO)
    private readonly memoDocRepo: MemoDocRepoPort,
    @Inject(HIGHLIGHT_DOC_REPO)
    private readonly highlightDocRepo: HighlightDocRepoPort,
  ) {}

  private getLastSyncedAt(type: NodeType): Timestamp {
    const saved = this.configService.get(`${type}.lastSyncedAt`);
    return saved
      ? Timestamp.create(new Date(saved))
      : Timestamp.create(
          new Date(Date.now() - this.SYNC_INTERVAL_MS),
        );
  }

  private saveLastSyncedAt(
    timestamp: Timestamp,
    type: NodeType,
  ): void {
    this.configService.set(
      `${type}.lastSyncedAt`,
      timestamp.value.toISOString(),
    );
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async syncMemos() {
    const from = this.getLastSyncedAt('memo');
    const to = Timestamp.now();

    const updatedMemos = await this.nodeRepo
      .findMemosWithDeletedAt()
      .byMarkdownUpdatedBetween(from, to);

    if (updatedMemos.length > 0) {
      await this.memoDocRepo.bulkMemos(updatedMemos);
    }

    this.saveLastSyncedAt(to, 'memo');
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async syncHighlights() {
    const from = this.getLastSyncedAt('highlight');
    const to = Timestamp.now();

    const updatedHighlights = await this.nodeRepo
      .findHighlightsWithDeletedAt()
      .byUpdatedBetween(from, to);

    if (updatedHighlights.length > 0) {
      await this.highlightDocRepo.bulkHighlights(
        updatedHighlights,
      );
    }

    this.saveLastSyncedAt(to, 'highlight');
  }
}
