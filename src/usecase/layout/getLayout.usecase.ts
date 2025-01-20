import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Builder } from 'builder-pattern';
import { Url } from 'src/domain/vo/url';
import {
  GetLayoutDtoIn,
  GetLayoutDtoOut,
  GetLayoutUsecasePort,
} from 'src/port/in/layout/getLayout.usecase.port';
import {
  LAYOUT_REPO,
  LayoutRepoPort,
} from 'src/port/out/layout.repo.port';

@Injectable()
export class GetLayoutUsecase implements GetLayoutUsecasePort {
  constructor(
    @Inject(LAYOUT_REPO)
    private readonly layoutRepo: LayoutRepoPort,
  ) {}

  async execute(
    dto: GetLayoutDtoIn,
    client: Client,
  ): Promise<GetLayoutDtoOut> {
    // dto로 vo 생성
    const targetUrl = Url.create(dto.url);

    // 데이터 조회
    const { nodes, highlights } = await this.layoutRepo
      .findNodesHighlights()
      .byTargetUrlUserId(targetUrl, client.id);

    // 해당 데이터가 없으면 404
    if (nodes.length === 0 && highlights.length === 0) {
      throw new NotFoundException();
    }

    // dto out에 맞게 매핑
    return Builder(GetLayoutDtoOut)
      .nodes(
        nodes.map((node) => ({
          localId: node.localId.value,
          markdown: node.markdown.value,
          pos: node.pos.value,
          scope: node.scope.value,
          createdAt: node.createdAt!.value,
          updatedAt: node.updatedAt!.value,
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
