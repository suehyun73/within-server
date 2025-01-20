import { Id } from '../vo/id';
import { Selector } from '../vo/selector';
import { Span } from '../vo/span';
import { Timestamp } from '../vo/timestamp';
import { Url } from '../vo/url';

export class Highlight {
  id?: Id;
  userId!: Id;
  targetUrl!: Url;
  selector!: Selector;
  spans!: Span[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  deletedAt?: Timestamp;
}
