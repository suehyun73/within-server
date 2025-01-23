import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class Q {
  static schema = z.string().min(2).max(100);

  private constructor(
    readonly value: z.infer<typeof Q.schema>,
  ) {}

  static isValid(value: z.infer<typeof Q.schema>) {
    try {
      this.schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static create(value: z.infer<typeof Q.schema>) {
    if (!Q.isValid(value)) throw new BadRequestException();
    return new Q(value);
  }
}
