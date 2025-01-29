import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Timestamp } from 'src/domain/vo/timestamp';
import {
  NODE_RDB_REPO,
  NodeRdbRepoPort,
} from 'src/port/out/rdb/node.rdb.repo.port';
import {
  NODE_SEARCH_REPO,
  NodeSearchRepoPort,
} from 'src/port/out/search/node.search.repo.port';

@Injectable()
export class BatchService {
  private static readonly BATCH_INTERVAL_SECONDS = 5;

  constructor(
    @Inject(NODE_RDB_REPO)
    private readonly nodeRdbRepo: NodeRdbRepoPort,
    @Inject(NODE_SEARCH_REPO)
    private readonly nodeSearchRepo: NodeSearchRepoPort,
  ) {}

  @Cron(`*/${BatchService.BATCH_INTERVAL_SECONDS} * * * * *`)
  async batchNodesPgToMs() {
    const from = Timestamp.create(
      new Date(
        Date.now() - BatchService.BATCH_INTERVAL_SECONDS * 1000,
      ),
    );
    const to = Timestamp.now();

    const recentlyUpdatedNodes = await this.nodeRdbRepo
      .findNodesIncludedDeleted()
      .betweenUpdatedAt(from, to);

    await Promise.all([
      this.nodeSearchRepo.batchMemos(recentlyUpdatedNodes.memos),
      this.nodeSearchRepo.batchHighlights(
        recentlyUpdatedNodes.highlights,
      ),
    ]);
  }
}
