import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SchedulerService } from './scheduler.service';
import { DbModule } from '../db/db.module';
import { EsModule } from '../es/es.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DbModule,
    EsModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
