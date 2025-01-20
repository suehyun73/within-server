import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class Span {
  static schema = z.object({
    start: z.number().nonnegative(),
    text: z.string(),
  });

  private constructor(readonly value: z.infer<typeof Span.schema>) {}

  static isValid(value: z.infer<typeof Span.schema>) {
    try {
      this.schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static create(value: z.infer<typeof Span.schema>) {
    if (!Span.isValid(value)) throw new BadRequestException();
    return new Span(value);
  }
}
