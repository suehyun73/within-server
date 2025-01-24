import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Builder } from 'builder-pattern';
import { Q } from 'src/domain/vo/q';
import {
  SearchNodesDtoIn,
  SearchNodesDtoOut,
  SearchNodesUsecasePort,
} from 'src/port/in/node/searchNodes.usecase.port';
import {
  HIGHLIGHT_DOC_REPO,
  HighlightDocRepoPort,
} from 'src/port/out/doc/highlight.doc.repo.port';
import {
  MEMO_DOC_REPO,
  MemoDocRepoPort,
} from 'src/port/out/doc/memo.doc.repo.port';
@Injectable()
export class SearchNodesUsecase
  implements SearchNodesUsecasePort
{
  constructor(
    @Inject(HIGHLIGHT_DOC_REPO)
    private readonly highlightDocRepo: HighlightDocRepoPort,
    @Inject(MEMO_DOC_REPO)
    private readonly memoDocRepo: MemoDocRepoPort,
  ) {}

  async execute(
    dto: SearchNodesDtoIn,
    client: Client,
  ): Promise<SearchNodesDtoOut> {
    // dto로 q vo 생성
    const q = Q.create(dto.q);

    // 기존 데이터 es로부터 조회
    const [highlightPieces, memoPieces] = await Promise.all([
      this.highlightDocRepo.searchHighlights(q, client.id),
      this.memoDocRepo.searchMemos(q, client.id),
    ]);

    // 해당 데이터가 없으면 404
    if (
      highlightPieces.length === 0 &&
      memoPieces.length === 0
    ) {
      throw new NotFoundException();
    }

    // dto out에 맞게 매핑
    return Builder(SearchNodesDtoOut)
      .memos(
        memoPieces.map((m) => ({
          id: m.id.value,
          targetUrl: m.targetUrl.value,
          markdown: m.markdown.value,
          pos: m.pos.value,
          createdAt: m.createdAt.value,
          updatedAt: m.updatedAt.value,
        })),
      )
      .highlights(
        highlightPieces.map((h) => ({
          id: h.id.value,
          targetUrl: h.targetUrl.value,
          selector: h.selector.value,
          text: h.span.value.text,
          createdAt: h.createdAt.value,
          updatedAt: h.updatedAt.value,
        })),
      )
      .build();
  }
}
