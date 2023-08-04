import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon from 'argon2';
import { AuthDTO } from './dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ERRORS_DICTIONARY } from 'src/constraints/error-dictionary.constraint';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async register(authDTO: AuthDTO) {
    try {
      const hashedPassword = await argon.hash(authDTO.password);
      const user = await this.prismaService.user.create({
        data: {
          email: authDTO.email,
          hashedPassword,
          firstName: '',
          lastName: '',
        },
        select: {
          email: true,
          id: true,
        },
      });
      return await this.signJwtToken(user.id, user.email);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ForbiddenException('User with this email already exists');
      }
    }
  }
  async login(authDTO: AuthDTO) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: {
          email: authDTO.email,
        },
      });
      if (!user) {
        throw new ForbiddenException('User not found');
      }
      const passwordMatched = await argon.verify(
        user.hashedPassword,
        authDTO.password,
      );
      if (!passwordMatched) {
        throw new ForbiddenException('Password does not match');
      }

      delete user.hashedPassword;

      return await this.signJwtToken(user.id, user.email);
    } catch (error) {
      throw new BadRequestException({
        message: ERRORS_DICTIONARY.WRONG_CREDENTIALS,
        details: 'Wrong credentials!!',
      });
    }
  }
  async signJwtToken(
    userId: number,
    email: string,
  ): Promise<{ accessToken: string }> {
    const payload = {
      sub: userId,
      email,
    };
    const jwtString = await this.jwtService.signAsync(payload, {
      expiresIn: '10m',
      secret: this.configService.get('JWT_SECRET'),
    });

    return {
      accessToken: jwtString,
    };
  }
}
