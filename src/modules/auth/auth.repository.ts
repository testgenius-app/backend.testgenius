import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { User, VerificationCode } from '@prisma/client';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(code: VerificationCode): Promise<User> {
    return await this.prisma.user.create({
      data: {
        email: code.email,
        firstName: code.firstName,
        lastName: code.lastName,
        password: code.password,
        coins: 0,
        isVerified: true,
        lastActiveDate: new Date(),
      },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async getUsers(): Promise<User[]> {
    return await this.prisma.user.findMany();
  }

  async getUsersCount(): Promise<number> {
    return await this.prisma.user.count();
  }

  
}
