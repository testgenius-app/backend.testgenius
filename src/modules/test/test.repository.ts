import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateTestDto } from './dto/create-test.dto';
import { IUser } from 'src/core/types/iuser.type';
import { Test } from '@prisma/client';
import { FilterDto } from './dto/filter.dto';

const include = {
  sections: {
    include: {
      tasks: {
        include: {
          questions: true,
        },
      },
    },
  },
};

@Injectable()
export class TestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTest(body: CreateTestDto, user: IUser) {
    const sectionsData = body.sections.map(
      ({
        title,
        instruction,
        type,
        contextText,
        contextImage,
        contextAudio,
        contextVideo,
        tasks,
      }) => ({
        title,
        instruction,
        type,
        contextText,
        contextImage,
        contextAudio,
        contextVideo,
        tasks: {
          create: tasks.map(({ title, type, questions }) => ({
            title,
            type,
            questions: {
              create: questions.map(
                ({
                  questionText,
                  options,
                  answers,
                  acceptableAnswers,
                  answerKeywords,
                  expectedResponseFormat,
                  score,
                  explanation,
                  imageUrl,
                  audioUrl,
                  labelLocationX,
                  labelLocationY,
                }) => ({
                  questionText,
                  options,
                  answers,
                  acceptableAnswers,
                  answerKeywords,
                  expectedResponseFormat,
                  score,
                  explanation,
                  imageUrl,
                  audioUrl,
                  labelLocationX,
                  labelLocationY,
                }),
              ),
            },
          })),
        },
      }),
    );

    try {
      return await this.prisma.test.create({
        data: {
          title: body.title,
          subject: body.subject,
          gradeLevel: body.gradeLevel,
          description: body.description,
          tags: body.tags || [],
          sectionCount: body.sectionCount,
          isPublic: body.isPublic || false,
          sections: {
            create: sectionsData,
          },
          owner: {
            connect: {
              id: user.id,
            },
          },
        },
        include,
      });
    } catch (error) {
      throw new BadRequestException('Test creation failed', error.message);
    }
  }

  async getTestById(id: string): Promise<any> {
    return await this.prisma.test.findUnique({
      where: { id },
      include,
    });
  }

  async getTestsByOwnerId(
    ownerId: string,
    filterDto: FilterDto,
  ): Promise<{
    tests: Test[];
    count: number;
  }> {
    const [tests, count] = await this.prisma.$transaction([
      this.prisma.test.findMany({
        where: { ownerId },
        include,
        orderBy: {
          createdAt: filterDto.order,
        },
        skip: (filterDto.page - 1) * filterDto.limit,
        take: filterDto.limit,
      }),
      this.prisma.test.count({
        where: { ownerId },
      }),
    ]);
    return { tests, count };
  }
}
