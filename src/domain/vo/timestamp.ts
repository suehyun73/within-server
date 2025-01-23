import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class Timestamp {
  static schema = z.date();

  private constructor(
    public readonly value: z.infer<typeof Timestamp.schema>,
  ) {}

  static isValid(value: z.infer<typeof Timestamp.schema>) {
    try {
      this.schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static create(value: z.infer<typeof Timestamp.schema>) {
    if (!Timestamp.isValid(value))
      throw new BadRequestException();
    return new Timestamp(value);
  }

  static fromString(value: string) {
    const date = new Date(value);
    if (!Timestamp.isValid(date))
      throw new BadRequestException();

    return new Timestamp(date);
  }

  static now() {
    return Timestamp.create(new Date());
  }
}
