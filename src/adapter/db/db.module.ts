import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DB_SERVICE } from 'src/port/out/db.service.port';
import { DbService } from './db.service';
import { LayoutRepo } from './repo/layout.repo';
import { UserRepo } from './repo/user.repo';
import { USER_REPO } from 'src/port/out/user.repo.port';
import { LAYOUT_REPO } from 'src/port/out/layout.repo.port';

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
    { provide: LAYOUT_REPO, useClass: LayoutRepo },
  ],
  exports: [DB_SERVICE, USER_REPO, LAYOUT_REPO],
})
export class DbModule {}
