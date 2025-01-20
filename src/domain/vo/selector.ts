import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class Selector {
  static schema = z.string();

  private constructor(readonly value: z.infer<typeof Selector.schema>) {}

  static isValid(value: z.infer<typeof Selector.schema>) {
    try {
      this.schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static create(value: z.infer<typeof Selector.schema>) {
    if (!Selector.isValid(value)) throw new BadRequestException();
    return new Selector(value);
  }
}
