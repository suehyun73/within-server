import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export class Url {
  static schema = z.string().url();

  private constructor(public readonly value: z.infer<typeof Url.schema>) {}

  static isValid(value: z.infer<typeof Url.schema>) {
    try {
      this.schema.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static create(value: z.infer<typeof Url.schema>) {
    if (!Url.isValid(value)) throw new BadRequestException();
    return new Url(value);
  }

  static fromParts(domain: string, path: string = '/') {
    const url = `https://${domain}${path.startsWith('/') ? path : `/${path}`}`;
    return Url.create(url);
  }

  extract() {
    const url = new URL(this.value);
    return { domain: url.hostname, path: url.pathname };
  }
}
