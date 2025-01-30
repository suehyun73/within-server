import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NODE_SEARCH_REPO } from 'src/port/out/search/node.search.repo.port';
import { NodeMsRepo } from './repo/node.ms.repo';
import { MsService } from './ms.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    {
      provide: MsService,
      useFactory: (configService: ConfigService) => {
        return new MsService(configService);
      },
      inject: [ConfigService],
    },
    { provide: NODE_SEARCH_REPO, useClass: NodeMsRepo },
  ],
  exports: [NODE_SEARCH_REPO],
})
export class MsModule {}
