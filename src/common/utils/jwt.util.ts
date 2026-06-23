import { Logger } from '@nestjs/common';

export interface UserFromToken {
  id: number;
  role: {
    key: string;
  };
}

export class JwtUtil {
  private static readonly logger = new Logger(JwtUtil.name);

  static extractUserFromToken(
    authorization?: string,
  ): UserFromToken | undefined {
    if (!authorization?.startsWith('Bearer ')) {
      return undefined;
    }

    try {
      const token = authorization.substring(7);
      const base64Payload = token.split('.')[1];
      const payload = JSON.parse(
        Buffer.from(base64Payload, 'base64').toString(),
      );

      if (payload.sub && payload.roleKey) {
        return {
          id: payload.sub,
          role: {
            key: payload.roleKey,
          },
        };
      }
    } catch (error) {
      this.logger.error('Failed to parse JWT payload', error);
      return undefined;
    }
  }
}
