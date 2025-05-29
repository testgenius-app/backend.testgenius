import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateTestDto } from './dto/create-test.dto';
import { IUser } from 'src/core/types/iuser.type';
import { Test, Prisma } from '@prisma/client';
import { FilterDto } from './dto/filter.dto';
import { UpdateTestDto } from './dto/update-test.dto';

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
    const where: Prisma.TestWhereInput = {
      ownerId,
      ...(filterDto.search
        ? {
            OR: [
              { title: { contains: filterDto.search, mode: Prisma.QueryMode.insensitive } },
              { description: { contains: filterDto.search, mode: Prisma.QueryMode.insensitive } },
              { subject: { contains: filterDto.search, mode: Prisma.QueryMode.insensitive } },
              { tags: { hasSome: [filterDto.search] } },
            ],
          }
        : {}),
    };

    const [tests, count] = await this.prisma.$transaction([
      this.prisma.test.findMany({
        where,
        orderBy: {
          createdAt: filterDto.order,
        },
        skip: (filterDto.page - 1) * filterDto.limit,
        take: filterDto.limit,
      }),
      this.prisma.test.count({
        where,
      }),
    ]);
    return { tests, count };
  }

  async updateTest(id: string, data: UpdateTestDto): Promise<Test> {
    const updateData: Prisma.TestUpdateInput = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }
    if (data.subject !== undefined) {
      updateData.subject = data.subject;
    }
    if (data.gradeLevel !== undefined) {
      updateData.gradeLevel = data.gradeLevel;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.tags !== undefined) {
      updateData.tags = data.tags;
    }
    if (data.isPublic !== undefined) {
      updateData.isPublic = data.isPublic;
    }

    return this.prisma.test.update({
      where: { id },
      data: updateData,
      include,
    });
  }

  async deleteTest(id: string): Promise<Test> {
    return this.prisma.test.delete({
      where: { id },
    });
  }
}
