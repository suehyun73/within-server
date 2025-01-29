import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Timestamp } from 'src/domain/vo/timestamp';
import {
  NODE_RDB_REPO,
  NodeRdbRepoPort,
} from 'src/port/out/rdb/node.rdb.repo.port';
import { BATCH_CONST } from './batch.const';
import { Q } from 'src/domain/vo/q';
import { Id } from 'src/domain/vo/id';
import {
  NODE_SEARCH_REPO,
  NodeSearchRepoPort,
} from 'src/port/out/search/node.search.repo.port';
import { Cursor } from 'src/domain/vo/cursor';

@Injectable()
export class BatchService {
  constructor(
    @Inject(NODE_RDB_REPO)
    private readonly nodeRdbRepo: NodeRdbRepoPort,
    @Inject(NODE_SEARCH_REPO)
    private readonly nodeSearchRepo: NodeSearchRepoPort,
  ) {}

  @Cron(`*/${BATCH_CONST.BATCH_INTERVAL_SECONDS} * * * * *`)
  async batchNodesPgToMs() {
    const from = Timestamp.fromSeconds(
      Math.floor(
        (Date.now() -
          BATCH_CONST.BATCH_INTERVAL_SECONDS * 1000) /
          1000,
      ),
    );
    const to = Timestamp.fromSeconds(
      Math.floor(Date.now() / 1000),
    );

    const recentlyUpdatedNodes = await this.nodeRdbRepo
      .findNodesIncludedDeleted()
      .betweenUpdatedAt(from, to);

    await Promise.all([
      this.nodeSearchRepo.batchMemos(
        recentlyUpdatedNodes.memos,
        BATCH_CONST.BATCH_SIZE,
      ),
      this.nodeSearchRepo.batchHighlights(
        recentlyUpdatedNodes.highlights,
        BATCH_CONST.BATCH_SIZE,
      ),
    ]);
  }
}
