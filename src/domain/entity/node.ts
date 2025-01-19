import { Id } from '../vo/id';
import { LocalId } from '../vo/localId';
import { Md } from '../vo/md';
import { Pos } from '../vo/pos';
import { Scope } from '../vo/scope';
import { Timestamp } from '../vo/timestamp';
import { Url } from '../vo/url';

export class Node {
  id?: Id;
  localId!: LocalId;
  userId!: Id;
  targetUrl!: Url;
  md!: Md;
  pos!: Pos;
  scope!: Scope;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  deletedAt?: Timestamp;
}
