import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { JwtConfig } from '@config/jwt.config';
import { PrismaService } from '@modules/prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly jwtConfig: JwtConfig,
    private readonly prisma: PrismaService,
  ) {
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    };
    super(options);
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.active) {
      throw new UnauthorizedException('User is inactive');
    }

    const permissions = user.role.rolePermissions.map(
      (rp) => rp.permission.code,
    );

    return {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role.name,
      permissions,
    };
  }
}
