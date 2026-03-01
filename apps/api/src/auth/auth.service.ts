import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, SignupTenantDto } from './dto';
import * as bcrypt from 'bcryptjs';
import { randomBytes, randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signupTenant(dto: SignupTenantDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const tenant = await this.prisma.tenant.create({
      data: {
        businessName: dto.businessName,
        gstin: dto.gstin,
        users: {
          create: {
            name: dto.ownerName,
            email: dto.ownerEmail.toLowerCase(),
            passwordHash,
            role: 'OWNER',
            isEmailVerified: false,
            emailVerificationToken: verificationToken,
            emailVerificationExpiresAt: verificationExpires,
          },
        },
      },
      include: { users: true },
    });

    const user = tenant.users[0];
    const base = process.env.APP_BASE_URL ?? 'http://localhost:3000';
    const verificationLink = `${base}/verify-email?token=${verificationToken}`;

    return {
      success: true,
      message: 'Signup successful. Please verify your email before login.',
      tenantId: tenant.id,
      userId: user.id,
      verificationLink,
    };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Verification token required');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        isActive: true,
      },
    });

    if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
      throw new BadRequestException('Verification link is invalid or expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    return { success: true, message: 'Email verified successfully. You can now log in.' };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before login');
    }

    return this.issueTokens(user.id, user.tenantId, user.role);
  }

  async refresh(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync<{ sub: string; tenantId: string; sid: string }>(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'invenzo-refresh-secret',
    });

    const session = await this.prisma.session.findUnique({ where: { id: payload.sid } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session invalid');
    }

    const tokenOk = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (!tokenOk) {
      throw new UnauthorizedException('Session invalid');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User missing');
    }

    return this.issueTokens(user.id, user.tenantId, user.role, session.id);
  }

  async logout(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync<{ sid: string }>(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'invenzo-refresh-secret',
    });

    await this.prisma.session.updateMany({
      where: { id: payload.sid },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  async me(userId: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        isEmailVerified: true,
      },
    });

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, businessName: true, gstin: true, address: true },
    });

    return { user, tenant };
  }

  private async issueTokens(userId: string, tenantId: string, role: string, existingSessionId?: string) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, tenantId, role },
      {
        secret: process.env.JWT_ACCESS_SECRET ?? 'invenzo-access-secret',
        expiresIn: '15m',
      },
    );

    const sessionId = existingSessionId ?? randomUUID();
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, tenantId, sid: sessionId },
      {
        secret: process.env.JWT_REFRESH_SECRET ?? 'invenzo-refresh-secret',
        expiresIn: '30d',
      },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.session.upsert({
      where: { id: sessionId },
      update: {
        refreshTokenHash,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      },
      create: {
        id: sessionId,
        userId,
        tenantId,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      },
    });

    return { accessToken, refreshToken, tenantId, userId, role };
  }
}
