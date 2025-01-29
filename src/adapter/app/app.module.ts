import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SaveNodesUsecase } from 'src/usecase/node/saveNodes.usecase';
import { NodeController } from './controller/node.controller';
import { SAVE_NODES_USECASE } from 'src/port/in/node/saveNodes.usecase.port';
import { JwtModule } from '@nestjs/jwt';
import { Ouath2Controller } from './controller/oauth2.controller';
import { GoogleOauth2Strategy } from './auth/googleOauth2/googleOauth2.strategy';
import { GoogleOauth2Guard } from './auth/googleOauth2/googleOauth2.guard';
import { JwtStrategy } from './auth/jwt/jwt.strategy';
import { JwtGuard } from './auth/jwt/jwt.guard';
import { RolesGuard } from './auth/roles/roles.guard';
import { GET_NODES_USECASE } from 'src/port/in/node/getNodes.usecase.port';
import { GetNodesUsecase } from 'src/usecase/node/getNodes.usecase';
import { PgModule } from '../pg/pg.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BatchService } from './scheduler/batch.service';
import { MsModule } from '../ms/ms.module';

@Module({
  // 현재 모듈에서 사용하려는 다른 모듈
  imports: [
    // 어떤 모듈에서든 configService를 주입받을 수 있도록
    ConfigModule.forRoot({ isGlobal: true }),

    // 환경변수를 관리하는 configService를 (동적으로) 주입받기 위한 registerAsync
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '2d' },
      }),
      // 위의 configService 파라미터에 주입될 의존성
      inject: [ConfigService],
    }),

    PgModule,
    MsModule,
    ScheduleModule.forRoot(),
  ],

  controllers: [NodeController, Ouath2Controller],

  // 사용할 클래스들의 의존성 주입
  providers: [
    // 구글 oauth2 auth 모듈
    GoogleOauth2Strategy,
    GoogleOauth2Guard,

    // jwt auth 모듈
    JwtStrategy,
    JwtGuard,

    // roles auth 모듈
    RolesGuard,

    // scheduler 관련 서비스
    BatchService,

    // usecase 클래스
    {
      provide: SAVE_NODES_USECASE,
      useClass: SaveNodesUsecase,
    },
    {
      provide: GET_NODES_USECASE,
      useClass: GetNodesUsecase,
    },
  ],

  // 다른 모듈이 사용할 수 있도록 노출할 provider 정의
  exports: [],
})
export class AppModule {}
