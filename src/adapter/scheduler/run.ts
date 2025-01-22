import { NestFactory } from '@nestjs/core';
import { SchedulerModule } from './scheduler.module';

async function run() {
  const app = await NestFactory.create(SchedulerModule);
  await app.init();
}
run();
