import { Email } from '../vo/email';
import { GoogleId } from '../vo/googleId';
import { Id } from '../vo/id';
import { Name } from '../vo/name';
import { Role } from '../vo/role';
import { Timestamp } from '../vo/timestamp';
import { Url } from '../vo/url';

export class User {
  id?: Id;
  googleId!: GoogleId;
  name!: Name;
  email!: Email;
  roles!: Role[];
  profileUrl?: Url;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  deletedAt?: Timestamp;
}
