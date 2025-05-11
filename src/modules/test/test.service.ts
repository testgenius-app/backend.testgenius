import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTestDto } from './dto/create-test.dto';
import { IUser } from 'src/core/types/iuser.type';
import * as fs from 'fs';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { TestRepository } from './test.repository';
import { FilterDto } from './dto/filter.dto';
import { DownloadDto } from './dto/download.dto';

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

  async getTestById(id: string, user: IUser) {
    const test = await this.testRepository.getTestById(id);
    if (!test || test.ownerId !== user.id)
      throw new NotFoundException('Test not found');

    return test;
  }

  async getTestsByOwnerId(user: IUser, filterDto: FilterDto) {
    const { tests, count } = await this.testRepository.getTestsByOwnerId(
      user.id,
      filterDto,
    );
    return { tests, count };
  }
  async downloadTest(user: IUser, query: DownloadDto) {
    const { testId, type } = query;
    const test = await this.testRepository.getTestById(testId);
    if (!test || test.ownerId !== user.id) {
      throw new NotFoundException('Test not found');
    }
    const file = fs.writeFileSync(
      `${testId}.${type}`,
      JSON.stringify(test),
      'utf8',
    );
    return {
      file,
      message: 'File downloaded successfully',
    };
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
