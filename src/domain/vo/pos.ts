import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class Pos {
  static schema = z.object({
    x: z.number(),
    y: z.number(),
  });

  private constructor(
    readonly value: z.infer<typeof Pos.schema>,
  ) {}

  static isValid(value: z.infer<typeof Pos.schema>) {
    try {
      this.schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static create(value: z.infer<typeof Pos.schema>) {
    if (!Pos.isValid(value)) throw new BadRequestException();
    return new Pos(value);
  }
}
