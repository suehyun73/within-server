import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class Name {
  static schema = z.string();

  private constructor(
    readonly value: z.infer<typeof Name.schema>,
  ) {}

  static isValid(value: z.infer<typeof Name.schema>) {
    try {
      this.schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static create(value: z.infer<typeof Name.schema>) {
    if (!Name.isValid(value)) throw new BadRequestException();
    return new Name(value);
  }
}
