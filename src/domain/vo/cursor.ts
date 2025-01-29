import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class Cursor {
  static schema = z.number().nonnegative();

  private constructor(
    readonly value: z.infer<typeof Cursor.schema>,
  ) {}

  static isValid(value: z.infer<typeof Cursor.schema>) {
    try {
      this.schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static create(value: z.infer<typeof Cursor.schema>) {
    if (!Cursor.isValid(value)) throw new BadRequestException();
    return new Cursor(value);
  }
}
