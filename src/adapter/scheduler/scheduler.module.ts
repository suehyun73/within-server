import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SchedulerService } from './scheduler.service';
import { PgModule } from '../pg/pg.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MsModule } from '../ms/ms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PgModule,
    MsModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
