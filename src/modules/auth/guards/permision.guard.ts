import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtTokenService } from '../services/jwt.service';
import { AuthService } from '../services/auth.service';
import { Request } from 'express';
import { PERMISSION_KEY } from '../decorators/permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private jwtTokenService: JwtTokenService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtTokenService.verifyToken(token);
      const user = await this.authService.validateUser(payload.sub);

      if (!user?.isActive) {
        throw new UnauthorizedException('User is not active');
      }

      if (!user?.isVerified) {
        throw new UnauthorizedException('User is not verified');
      }

      request.user = user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required, allow access
    }

    let userPermissions: string[] = [];

    const requestWithAuth = request as Request & {
      user: { id: number };
      jwtPayload?: { permissions: unknown };
    };

    if (
      requestWithAuth.jwtPayload &&
      Array.isArray(requestWithAuth.jwtPayload.permissions)
    ) {
      userPermissions = requestWithAuth.jwtPayload.permissions as string[];
    } else {
      const userWithRole = await this.prisma.user.findUnique({
        where: { id: requestWithAuth.user.id },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!userWithRole?.role) {
        throw new UnauthorizedException('User has no role assigned');
      }

      userPermissions = userWithRole.role.rolePermissions.map(
        (rp) => rp.permission.key,
      );
    }

    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new UnauthorizedException(
        `Missing required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
