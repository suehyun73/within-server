import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class Markdown {
  static schema = z.string();

  private constructor(readonly value: z.infer<typeof Markdown.schema>) {}

  static isValid(value: z.infer<typeof Markdown.schema>) {
    try {
      this.schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static create(value: z.infer<typeof Markdown.schema>) {
    if (!Markdown.isValid(value)) throw new BadRequestException();
    return new Markdown(value);
  }
}
