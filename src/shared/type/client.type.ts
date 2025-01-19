import { Id } from 'src/domain/vo/id';
import { Role } from 'src/domain/vo/role';

declare global {
  interface Client {
    id: Id;
    roles: Role[];
  }

  interface Request {
    user?: Client;
  }
}
