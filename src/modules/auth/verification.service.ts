import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { VerificationDto } from './dto/verification.dto';
import { User, VerificationCode } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { UtilsService } from 'src/core/utils/utils.service';

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService,
  ) {}

  async createVerificationCode(data: RegisterDto): Promise<VerificationCode> {
    return this.createCode(data, false);
  }

  async createRestoreVerificationCode(user: User): Promise<VerificationCode> {
    return this.createCode(user, true);
  }

  private async createCode(
    data: RegisterDto | User,
    isRestore = false,
  ): Promise<VerificationCode> {
    if (isRestore) {
      await this.prisma.verificationCode.deleteMany({
        where: {
          email: data.email,
        },
      });
    }
    const existingCode = await this.prisma.verificationCode.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingCode && existingCode.expiresAt > new Date()) {
      return existingCode;
    }

    if (existingCode) {
      await this.prisma.verificationCode.delete({
        where: {
          email: data.email,
        },
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = uuid();
    const password = isRestore
      ? ''
      : await this.utilsService.hashPassword(data.password);
    return await this.prisma.verificationCode.create({
      data: {
        code,
        token,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName ?? '',
        password,
        expiresAt: new Date(Date.now() + 1000 * 60 * 15),
      },
    });
  }

  async verifyVerificationCode(
    data: VerificationDto,
  ): Promise<VerificationCode> {
    const verificationCode = await this.prisma.verificationCode.findUnique({
      where: {
        token: data.token,
        code: data.code,
      },
    });

    if (!verificationCode) {
      throw new BadRequestException('Invalid verification code');
    }

    if (verificationCode.expiresAt < new Date()) {
      await this.prisma.verificationCode.delete({
        where: {
          code: data.code,
        },
      });
      throw new BadRequestException('Verification code expired');
    }

    return verificationCode;
  }
}
