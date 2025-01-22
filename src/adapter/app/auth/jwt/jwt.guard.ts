import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// guard : "언제" 인증을 적용할지
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {}
