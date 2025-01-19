import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserRepoPort, USER_REPO } from 'src/port/out/repo/user.repo.port';
import { GoogleId } from 'src/domain/vo/googleId';
import { Name } from 'src/domain/vo/name';
import { Url } from 'src/domain/vo/url';
import { Role } from 'src/domain/vo/role';
import { Email } from 'src/domain/vo/email';
import { User } from 'src/domain/entity/user';
import { JwtService } from '@nestjs/jwt';
import { Builder } from 'builder-pattern';

@Injectable()
export class GoogleOauth2Strategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(USER_REPO) private readonly userRepo: UserRepoPort,
  ) {
    super({
      clientID: configService.getOrThrow('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow('GOOGLE_REDIRECT_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const googleId = GoogleId.create(profile._json.sub);

    let foundUser = await this.userRepo.findOneByGoogleId(googleId);

    if (!foundUser) {
      foundUser = await this.userRepo.save(
        Builder(User)
          .googleId(googleId)
          .name(Name.create(profile._json.name))
          .email(Email.create(profile._json.email))
          .roles([Role.create('general')])
          .profileUrl(Url.create(profile._json.picture))
          .build(),
      );
    }

    const token = this.jwtService.sign({
      id: foundUser.id!.value,
      roles: foundUser.roles.map((role) => role.value),
    });

    done(null, { token });
  }
}
