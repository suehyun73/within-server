import { Injectable } from '@nestjs/common';

@Injectable()
export class Sync {
  constructor() {
    this.syncHighlight();
    this.syncNode();
  }

  async syncHighlight() {}

  async syncNode() {}
}
