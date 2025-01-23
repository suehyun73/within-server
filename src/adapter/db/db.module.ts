import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DB_SERVICE } from 'src/port/out/db/db.service.port';
import { DbService } from './db.service';
import { NodeRepo } from './repo/node.repo';
import { UserRepo } from './repo/user.repo';
import { USER_REPO } from 'src/port/out/db/user.repo.port';
import { NODE_REPO } from 'src/port/out/db/node.repo.port';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    {
      provide: DB_SERVICE,
      useFactory: (configService: ConfigService) => {
        return new DbService(configService);
      },
      inject: [ConfigService],
    },
    { provide: USER_REPO, useClass: UserRepo },
    { provide: NODE_REPO, useClass: NodeRepo },
  ],
  exports: [DB_SERVICE, USER_REPO, NODE_REPO],
})
export class DbModule {}
