import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class Email {
  static schema = z.string();

  private constructor(
    readonly value: z.infer<typeof Email.schema>,
  ) {}

  static isValid(value: z.infer<typeof Email.schema>) {
    try {
      this.schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static create(value: z.infer<typeof Email.schema>) {
    if (!Email.isValid(value)) throw new BadRequestException();
    return new Email(value);
  }
}
