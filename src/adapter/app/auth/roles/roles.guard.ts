import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UseRoles } from './useRoles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get(
      UseRoles,
      ctx.getHandler(),
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = ctx.switchToHttp().getRequest<Request>();

    if (!user) {
      throw new ForbiddenException();
    }

    const hasRole = requiredRoles.some((role) =>
      user.roles.map((role) => role.value).includes(role),
    );

    if (!hasRole) {
      throw new ForbiddenException();
    }

    return true;
  }
}
