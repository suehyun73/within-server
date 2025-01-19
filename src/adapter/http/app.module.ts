import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SaveUsecase } from 'src/usecase/layout/save.usecase';
import { LayoutController } from './controller/layout.controller';
import { SAVE_USECASE } from 'src/port/in/layout/save.usecase.port';
import { DbService } from 'src/adapter/db/db.service';
import { JwtModule } from '@nestjs/jwt';
import { Ouath2Controller } from './controller/oauth2.controller';
import { GoogleOauth2Strategy } from './auth/googleOauth2/googleOauth2.strategy';
import { GoogleOauth2Guard } from './auth/googleOauth2/googleOauth2.guard';
import { JwtStrategy } from './auth/jwt/jwt.strategy';
import { JwtGuard } from './auth/jwt/jwt.guard';
import { RolesGuard } from './auth/roles/roles.guard';
import { NodeRepo } from '../db/repo/node.repo';
import { UserRepo } from '../db/repo/user.repo';
import { USER_REPO } from 'src/port/out/repo/user.repo.port';
import { NODE_REPO } from 'src/port/out/repo/node.repo.port';

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
  ],
  controllers: [LayoutController, Ouath2Controller],

  // 모듈에서 사용할 서비스나 리포지토리 등의 의존성 주입 정의
  providers: [
    DbService,

    GoogleOauth2Strategy,
    GoogleOauth2Guard,
    JwtStrategy,
    JwtGuard,
    RolesGuard,

    { provide: USER_REPO, useClass: UserRepo },
    { provide: NODE_REPO, useClass: NodeRepo },

    { provide: SAVE_USECASE, useClass: SaveUsecase },
  ],

  // 현재 모듈에서 다른 모듈이 사용할 수 있도록 외부로 노출하는 providers를 정의
  exports: [],
})
export class AppModule {}
