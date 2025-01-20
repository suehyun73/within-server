import {
  Strategy,
  VerifyCallback,
} from 'passport-google-oauth20';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  UserRepoPort,
  USER_REPO,
} from 'src/port/out/user.repo.port';
import { GoogleId } from 'src/domain/vo/googleId';
import { Name } from 'src/domain/vo/name';
import { Url } from 'src/domain/vo/url';
import { Role } from 'src/domain/vo/role';
import { Email } from 'src/domain/vo/email';
import { User } from 'src/domain/entity/user';
import { JwtService } from '@nestjs/jwt';
import { Builder } from 'builder-pattern';

@Injectable()
export class GoogleOauth2Strategy extends PassportStrategy(
  Strategy,
  'google',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(USER_REPO) private readonly userRepo: UserRepoPort,
  ) {
    super({
      clientID: configService.getOrThrow('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow(
        'GOOGLE_CLIENT_SECRET',
      ),
      callbackURL: configService.getOrThrow(
        'GOOGLE_REDIRECT_URL',
      ),
      scope: ['email', 'profile'],
    });
  }

  /**
   * Google OAuth 인증 후 사용자 검증 및 JWT 토큰 발급
   * @param accessToken Google OAuth 액세스 토큰
   * @param refreshToken Google OAuth 리프레시 토큰
   * @param profile Google 사용자 프로필
   * @param done Passport 검증 콜백
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const { sub, name, email, picture } = profile._json;
    const userId = GoogleId.create(sub);

    // 기존 사용자 조회
    let user = await this.userRepo.findUser().byGoogleId(userId);

    // 신규 사용자인 경우 생성
    if (!user) {
      const newUser = Builder(User)
        .googleId(userId)
        .name(Name.create(name))
        .email(Email.create(email))
        .roles([Role.create('general')])
        .profileUrl(Url.create(picture))
        .build();

      user = await this.userRepo.saveUser(newUser);
    }

    // JWT 토큰 생성
    const jwtToken = this.jwtService.sign({
      id: user.id!.value,
      roles: user.roles.map((role) => role.value),
    });

    done(null, { token: jwtToken });
  }
}
