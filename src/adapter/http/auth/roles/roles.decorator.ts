import { Reflector } from '@nestjs/core';
import { Role } from 'src/domain/vo/role';
import { z } from 'zod';

export const Roles =
  Reflector.createDecorator<z.infer<typeof Role.schema>[]>();
