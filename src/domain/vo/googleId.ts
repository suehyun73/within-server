import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class GoogleId {
  static schema = z.string();

  private constructor(readonly value: z.infer<typeof GoogleId.schema>) {}

  static isValid(value: z.infer<typeof GoogleId.schema>) {
    try {
      this.schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static create(value: z.infer<typeof GoogleId.schema>) {
    if (!GoogleId.isValid(value)) throw new BadRequestException();
    return new GoogleId(value);
  }
}
