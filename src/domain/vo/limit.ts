import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class Limit {
  static schema = z.number().positive();

  private constructor(
    readonly value: z.infer<typeof Limit.schema>,
  ) {}

  static isValid(value: z.infer<typeof Limit.schema>) {
    try {
      this.schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static create(value: z.infer<typeof Limit.schema>) {
    if (!Limit.isValid(value)) throw new BadRequestException();
    return new Limit(value);
  }
}
