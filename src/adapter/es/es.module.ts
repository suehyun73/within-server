import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { LayoutDocRepo } from './repo/layoutDoc.repo';
import { LAYOUT_DOC_REPO } from 'src/port/out/layoutDoc.repo.port';

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
    { provide: LAYOUT_DOC_REPO, useClass: LayoutDocRepo },
  ],
  exports: [LAYOUT_DOC_REPO],
})
export class EsModule {}
