import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExceptionFilter } from './filter/exception.filter';
import { SuccessInterceptor } from './interceptor/success.interceptor';

async function run() {
  const app = await NestFactory.create(AppModule);

  // 모든 api들이 "/api"로 시작
  app.setGlobalPrefix('api');

  app.useGlobalFilters(new ExceptionFilter());
  app.useGlobalInterceptors(new SuccessInterceptor());

  // dto를 체크하기 위한 class validator pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(process.env.APP_PORT!);
}
run();
