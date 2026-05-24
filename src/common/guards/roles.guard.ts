import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessTokenPayload } from '@src/common/types';
import { ROLES_KEY, ValidationErrorCode } from '@src/common/constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AccessTokenPayload = request.user;

    if (!user) {
      throw new ForbiddenException(ValidationErrorCode.UNAUTHORIZED);
    }

    const hasRole = requiredRoles.includes(user.roleCode);

    if (!hasRole) {
      throw new ForbiddenException(ValidationErrorCode.UNAUTHORIZED);
    }

    return true;
  }
}
