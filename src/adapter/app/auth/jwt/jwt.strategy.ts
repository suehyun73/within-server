import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Id } from 'src/domain/vo/id';
import { Role } from 'src/domain/vo/role';
import { z } from 'zod';

// strategy : "어떻게" 인증을 해결할지
@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
  'jwt',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
    });
  }

  async validate(payload: {
    id: z.infer<typeof Id.schema>;
    roles: z.infer<typeof Role.schema>[];
  }) {
    return {
      id: Id.create(payload.id),
      roles: payload.roles.map((role) => Role.create(role)),
    };
  }
}
