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
import { MsModule } from '../ms/ms.module';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { SEARCH_NODES_USECASE } from 'src/port/in/node/searchNodes.usecase.port';
import { SearchNodesUsecase } from 'src/usecase/node/searchNodes.usecase';
import { EsModule } from '../es/es.module';

@Module({
  // 현재 모듈에서 사용하려는 다른 모듈
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // 어떤 모듈에서든 configService를 주입받을 수 있도록
    JwtModule.registerAsync({
      // 비동기적인 configService를 사용하기 위함
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '2d' },
      }),
      inject: [ConfigService], // 위의 configService 파라미터에 주입될 의존성
    }),
    PgModule,
    EsModule,
    SchedulerModule,
  ],
  controllers: [NodeController, Ouath2Controller],

  // 모듈에서 사용할 서비스나 리포지토리 등의 의존성 주입 정의
  providers: [
    GoogleOauth2Strategy,
    GoogleOauth2Guard,
    JwtStrategy,
    JwtGuard,
    RolesGuard,
    {
      provide: SAVE_NODES_USECASE,
      useClass: SaveNodesUsecase,
    },
    {
      provide: GET_NODES_USECASE,
      useClass: GetNodesUsecase,
    },
    {
      provide: SEARCH_NODES_USECASE,
      useClass: SearchNodesUsecase,
    },
  ],

  // 현재 모듈에서 다른 모듈이 사용할 수 있도록 외부로 노출하는 providers를 정의
  exports: [],
})
export class AppModule {}
