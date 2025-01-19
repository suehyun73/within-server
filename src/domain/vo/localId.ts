import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class LocalId {
  static schema = z.string();

  private constructor(readonly value: z.infer<typeof LocalId.schema>) {}

  static isValid(value: z.infer<typeof LocalId.schema>) {
    try {
      this.schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static create(value: z.infer<typeof LocalId.schema>) {
    if (!LocalId.isValid(value)) throw new BadRequestException();
    return new LocalId(value);
  }
}
