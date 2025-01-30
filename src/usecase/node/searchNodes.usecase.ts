import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Builder } from 'builder-pattern';
import { Cursor } from 'src/domain/vo/cursor';
import { Limit } from 'src/domain/vo/limit';
import { Q } from 'src/domain/vo/q';
import {
  SearchNodesDtoIn,
  SearchNodesDtoOut,
  SearchNodesUsecasePort,
} from 'src/port/in/node/searchNodes.usecase.port';
import {
  NODE_SEARCH_REPO,
  NodeSearchRepoPort,
} from 'src/port/out/search/node.search.repo.port';

@Injectable()
export class SearchNodesUsecase
  implements SearchNodesUsecasePort
{
  constructor(
    @Inject(NODE_SEARCH_REPO)
    private readonly nodeSearchRepo: NodeSearchRepoPort,
  ) {}

  async execute(
    dto: SearchNodesDtoIn,
    client: Client,
  ): Promise<SearchNodesDtoOut> {
    // dto로 vo 생성
    const q = Q.create(dto.q);
    const cursor = Cursor.create(Number(dto.cursor));
    const limit = Limit.create(Number(dto.limit));

    // 검색 결과 조회
    const searchedNodes = await this.nodeSearchRepo.searchNodes(
      q,
      client.id,
      cursor,
      limit,
    );

    // 검색 결과가 없으면 404
    if (searchedNodes.length === 0) {
      throw new NotFoundException();
    }

    // dto out로 변환
    return Builder(SearchNodesDtoOut)
      .nodes(
        searchedNodes.map((searchedNode) => {
          switch (searchedNode.type) {
            case 'memo':
              return {
                type: searchedNode.type,
                id: searchedNode.entity.id!.value,
                targetUrl: searchedNode.entity.targetUrl.value,
                pos: searchedNode.entity.pos.value,
                markdown: {
                  original: searchedNode.entity.markdown.value,
                  withTag: searchedNode.markdownWithTag.value,
                },
                createdAt: searchedNode.entity.createdAt!.value,
                updatedAt: searchedNode.entity.updatedAt!.value,
              };
            case 'highlight':
              return {
                type: searchedNode.type,
                id: searchedNode.entity.id!.value,
                targetUrl: searchedNode.entity.targetUrl.value,
                selector: searchedNode.entity.selector.value,
                spans: {
                  original: searchedNode.entity.spans.map(
                    (span) => span.value.text,
                  ),
                  withTag: searchedNode.spansWithTag.map(
                    (span) => span.value.text,
                  ),
                },
                createdAt: searchedNode.entity.createdAt!.value,
                updatedAt: searchedNode.entity.updatedAt!.value,
              };
          }
        }),
      )
      .build();
  }
}
