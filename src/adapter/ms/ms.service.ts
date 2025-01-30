import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch } from 'meilisearch';

@Injectable()
export class MsService {
  private readonly instance: MeiliSearch;

  constructor(private readonly configService: ConfigService) {
    this.instance = new MeiliSearch({
      host: `http://${configService.getOrThrow('MS_HOST')}:${configService.getOrThrow('MS_PORT')}`,
      apiKey: configService.getOrThrow('MS_MASTER_KEY'),
    });
  }

  getInstance() {
    return this.instance;
  }
}
