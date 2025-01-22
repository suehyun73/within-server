import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class Role {
  static schema = z.enum(['general', 'admin']);

  private constructor(
    readonly value: z.infer<typeof Role.schema>,
  ) {}

  static isValid(value: z.infer<typeof Role.schema>) {
    try {
      this.schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static create(value: z.infer<typeof Role.schema>) {
    if (!Role.isValid(value)) throw new BadRequestException();
    return new Role(value);
  }
}
