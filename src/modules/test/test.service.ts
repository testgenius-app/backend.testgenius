import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateTestDto } from './dto/create-test.dto';
import { IUser } from 'src/core/types/iuser.type';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { TestRepository } from './test.repository';

@Injectable()
export class TestService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly testRepository: TestRepository,
  ) {}
  async create(user: IUser, body: CreateTestDto) {
    await this.validateUser(user);
    return this.testRepository.createTest(body, user);
  }

  async validateUser(user: IUser) {
    if (!user.id) {
      throw new UnauthorizedException('Unauthorized');
    }
    return await this.prismaService.user.findUnique({
      where: { id: user.id },
    });
  }
}
