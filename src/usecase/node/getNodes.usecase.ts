import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Builder } from 'builder-pattern';
import { Url } from 'src/domain/vo/url';
import {
  GetNodesDtoIn,
  GetNodesDtoOut,
  GetNodesUsecasePort,
} from 'src/port/in/node/getNodes.usecase.port';
import {
  NODE_RDB_REPO,
  NodeRdbRepoPort,
} from 'src/port/out/rdb/node.rdb.repo.port';

@Injectable()
export class GetNodesUsecase implements GetNodesUsecasePort {
  constructor(
    @Inject(NODE_RDB_REPO)
    private readonly nodeDbRepo: NodeRdbRepoPort,
  ) {}

  async execute(
    dto: GetNodesDtoIn,
    client: Client,
  ): Promise<GetNodesDtoOut> {
    // dto로 vo 생성
    const targetUrl = Url.create(dto.url);

    // 데이터 조회
    const { memos, highlights } = await this.nodeDbRepo
      .findNodes()
      .byTargetUrlUserId(targetUrl, client.id);

    // 해당 데이터가 없으면 404
    if (memos.length === 0 && highlights.length === 0) {
      throw new NotFoundException();
    }

    // dto out에 맞게 매핑
    return Builder(GetNodesDtoOut)
      .memos(
        memos.map((memo) => ({
          localId: memo.localId.value,
          markdown: memo.markdown.value,
          pos: memo.pos.value,
          scope: memo.scope.value,
          createdAt: memo.createdAt!.value,
          updatedAt: memo.updatedAt!.value,
        })),
      )
      .highlights(
        highlights.map((highlight) => ({
          selector: highlight.selector.value,
          spans: highlight.spans.map((span) => span.value),
          createdAt: highlight.createdAt!.value,
          updatedAt: highlight.updatedAt!.value,
        })),
      )
      .build();
  }
}
