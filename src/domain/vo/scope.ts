import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class Scope {
  static schema = z.enum(['global', 'domain', 'full-path']);

  private constructor(public readonly value: z.infer<typeof Scope.schema>) {}

  static isValid(value: z.infer<typeof Scope.schema>) {
    try {
      this.schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static create(value: z.infer<typeof Scope.schema>) {
    if (!Scope.isValid(value)) throw new BadRequestException();
    return new Scope(value);
  }
}
