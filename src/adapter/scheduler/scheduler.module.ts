import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Sync } from './sync';
import { DbModule } from '../db/db.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DbModule],
  providers: [Sync],
})
export class SchedulerModule {}
