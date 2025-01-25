import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RDB_SERVICE } from 'src/port/out/rdb/rdb.service.port';
import { PgService } from './pg.service';
import { NodePgRepo } from './repo/node.pg.repo';
import { PgUserDbRepo } from './repo/user.pg.repo';
import { USER_RDB_REPO } from 'src/port/out/rdb/user.rdb.repo.port';
import { NODE_RDB_REPO } from 'src/port/out/rdb/node.rdb.repo.port';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    {
      provide: RDB_SERVICE,
      useFactory: (configService: ConfigService) => {
        return new PgService(configService);
      },
      inject: [ConfigService],
    },
    { provide: USER_RDB_REPO, useClass: PgUserDbRepo },
    { provide: NODE_RDB_REPO, useClass: NodePgRepo },
  ],
  exports: [RDB_SERVICE, USER_RDB_REPO, NODE_RDB_REPO],
})
export class PgModule {}
