import { Highlight } from 'src/domain/entity/highlight';
import { Node } from 'src/domain/entity/node';

export const LAYOUT_DOC_REPO = Symbol('LAYOUT_DOC_REPO');

export interface LayoutDocRepoPort {
  bulkNodes(nodes: Node[]): Promise<void>;

  bulkHighlights(highlights: Highlight[]): Promise<void>;
}
