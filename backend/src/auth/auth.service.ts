import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });
    await this.userRepo.save(user);

    const tokens = await this.generateTokens(user);
    return {
      message: 'Registration successful',
      user: { id: user.id, name: user.name, email: user.email, profileCompleted: user.profileCompleted },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('No account found with this email. Please sign up first.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect password. Please try again.');
    }

    const tokens = await this.generateTokens(user);
    return {
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, profileCompleted: user.profileCompleted },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const tokenRecord = await this.refreshTokenRepo.findOne({
      where: { token: refreshToken, revoked: false },
      relations: ['user'],
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old token
    tokenRecord.revoked = true;
    await this.refreshTokenRepo.save(tokenRecord);

    // Generate new tokens
    const tokens = await this.generateTokens(tokenRecord.user);
    return {
      message: 'Token refreshed',
      ...tokens,
    };
  }

  // In-memory OTP store (simple approach for demo)
  private otpStore = new Map<string, { otp: string; expiresAt: Date }>();

  async forgotPassword(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('No account found with this email.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(email, {
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    return { message: 'OTP generated', otp };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const stored = this.otpStore.get(email);
    if (!stored) {
      throw new UnauthorizedException('No OTP requested for this email.');
    }
    if (stored.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP.');
    }
    if (stored.expiresAt < new Date()) {
      this.otpStore.delete(email);
      throw new UnauthorizedException('OTP has expired. Please request a new one.');
    }

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    this.otpStore.delete(email);

    return { message: 'Password reset successful. Please login with your new password.' };
  }

  async logout(refreshToken: string) {
    if (refreshToken) {
      await this.refreshTokenRepo.update(
        { token: refreshToken },
        { revoked: true },
      );
    }
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRY', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRY', '7d'),
    });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const tokenEntity = this.refreshTokenRepo.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });
    await this.refreshTokenRepo.save(tokenEntity);

    return { accessToken, refreshToken };
  }
}
