import { Id } from '../vo/id';
import { LocalId } from '../vo/localId';
import { Markdown } from '../vo/markdown';
import { Pos } from '../vo/pos';
import { Scope } from '../vo/scope';
import { Timestamp } from '../vo/timestamp';
import { Url } from '../vo/url';

export class Memo {
  id?: Id;
  localId!: LocalId;
  userId!: Id;
  targetUrl!: Url;
  markdown!: Markdown;
  pos!: Pos;
  scope!: Scope;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  markdownUpdatedAt?: Timestamp;
  deletedAt?: Timestamp;
}
