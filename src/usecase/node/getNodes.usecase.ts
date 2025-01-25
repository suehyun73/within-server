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
      .findMemosHighlights()
      .byTargetUrlUserId(targetUrl, client.id);

    // 해당 데이터가 없으면 404
    if (memos.length === 0 && highlights.length === 0) {
      throw new NotFoundException();
    }

    // dto out에 맞게 매핑
    return Builder(GetNodesDtoOut)
      .memos(
        memos.map((m) => ({
          localId: m.localId.value,
          markdown: m.markdown.value,
          pos: m.pos.value,
          scope: m.scope.value,
          createdAt: m.createdAt!.value,
          updatedAt: m.updatedAt!.value,
        })),
      )
      .highlights(
        highlights.map((h) => ({
          selector: h.selector.value,
          spans: h.spans.map((span) => span.value),
          createdAt: h.createdAt!.value,
          updatedAt: h.updatedAt!.value,
        })),
      )
      .build();
  }
}
