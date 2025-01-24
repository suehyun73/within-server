import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { HIGHLIGHT_DOC_REPO } from 'src/port/out/doc/highlight.doc.repo.port';
import { HighlightDocRepo } from './repo/highlightDoc.repo';
import { MemoDocRepo } from './repo/memoDoc.repo';
import { MEMO_DOC_REPO } from 'src/port/out/doc/memo.doc.repo.port';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        node: `http://${configService.getOrThrow('ES_HOST')}:${configService.getOrThrow('ES_PORT')}`,
        auth: {
          username: configService.getOrThrow('ES_USER'),
          password: configService.getOrThrow('ES_PW'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    { provide: HIGHLIGHT_DOC_REPO, useClass: HighlightDocRepo },
    { provide: MEMO_DOC_REPO, useClass: MemoDocRepo },
  ],
  exports: [HIGHLIGHT_DOC_REPO, MEMO_DOC_REPO],
})
export class EsModule {}
