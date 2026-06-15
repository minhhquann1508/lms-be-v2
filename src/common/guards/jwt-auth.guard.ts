import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@src/common/security/jwt/jwt.service';
import { IS_PUBLIC_KEY, ValidationErrorCode } from '@src/common/constants';
import { SessionService } from '@src/modules/session/session.service';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(ValidationErrorCode.UNAUTHENTICATED);
    }

    try {
      const payload = this.jwtService.verifyAccessToken(token);

      // If token has a sessionId, verify the session is still active.
      // This ensures sessions revoked via force-login / revoke-earliest
      // take effect immediately rather than waiting for access token expiry.
      if (payload.sessionId) {
        const session = await this.sessionService.findById(payload.sessionId);
        if (!session) {
          throw new UnauthorizedException(ValidationErrorCode.UNAUTHENTICATED);
        }
      }

      // Attach the user payload to the request object
      request['user'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException(ValidationErrorCode.UNAUTHENTICATED);
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
