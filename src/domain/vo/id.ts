import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class Id {
  static schema = z.number();

  private constructor(
    readonly value: z.infer<typeof Id.schema>,
  ) {}

  static isValid(value: z.infer<typeof Id.schema>) {
    try {
      this.schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static create(value: z.infer<typeof Id.schema>) {
    if (!Id.isValid(value)) throw new BadRequestException();
    return new Id(value);
  }
}
