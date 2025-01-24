import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DB_SERVICE } from 'src/port/out/db/db.service.port';
import { PgService } from './pg.service';
import { PgNodeDbRepo } from './repo/node.db.repo';
import { PgUserDbRepo } from './repo/user.db.repo';
import { USER_DB_REPO } from 'src/port/out/db/user.db.repo.port';
import { NODE_DB_REPO } from 'src/port/out/db/node.db.repo.port';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    {
      provide: DB_SERVICE,
      useFactory: (configService: ConfigService) => {
        return new PgService(configService);
      },
      inject: [ConfigService],
    },
    { provide: USER_DB_REPO, useClass: PgUserDbRepo },
    { provide: NODE_DB_REPO, useClass: PgNodeDbRepo },
  ],
  exports: [DB_SERVICE, USER_DB_REPO, NODE_DB_REPO],
})
export class PgModule {}
