import { Highlight } from 'src/domain/entity/highlight';
import { Id } from 'src/domain/vo/id';
import { Q } from 'src/domain/vo/q';
import { Selector } from 'src/domain/vo/selector';
import { Span } from 'src/domain/vo/span';
import { Timestamp } from 'src/domain/vo/timestamp';
import { Url } from 'src/domain/vo/url';

export const HIGHLIGHT_DOC_REPO = Symbol('HIGHLIGHT_DOC_REPO');

export interface HighlightDocRepoPort {
  bulkHighlights(highlights: Highlight[]): Promise<void>;

  searchHighlights(
    q: Q,
    userId: Id,
  ): Promise<
    {
      id: Id;
      selector: Selector;
      targetUrl: Url;
      span: Span;
      createdAt: Timestamp;
      updatedAt: Timestamp;
    }[]
  >;
}
