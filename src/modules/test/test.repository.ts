import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateTestDto } from './dto/create-test.dto';
import { IUser } from 'src/core/types/iuser.type';

const includeTest = {
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
        include: includeTest,
      });
    } catch (error) {
      throw new BadRequestException('Test creation failed', error.message);
    }
  }
}
