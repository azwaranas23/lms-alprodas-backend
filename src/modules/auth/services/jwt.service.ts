import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersResponseDto } from 'src/modules/users/dto/users-response.dto';

export interface JwtPayload {
  sub: number;
  email: string;
  roleKey: string;
  permissions: string[];
}

@Injectable()
export class JwtTokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(user: UsersResponseDto): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roleKey: user.role.key,
      permissions: user.role.permissions.map((p) => p.key),
    };
    return this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
  }

  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token);
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode<JwtPayload>(token);
    } catch (error) {
      return null;
    }
  }
}
