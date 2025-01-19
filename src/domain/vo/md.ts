import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class Md {
  static schema = z.string();

  private constructor(readonly value: z.infer<typeof Md.schema>) {}

  static isValid(value: z.infer<typeof Md.schema>) {
    try {
      this.schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static create(value: z.infer<typeof Md.schema>) {
    if (!Md.isValid(value)) throw new BadRequestException();
    return new Md(value);
  }
}
