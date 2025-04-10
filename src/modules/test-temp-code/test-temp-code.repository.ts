import { Injectable } from '@nestjs/common';
import { TestTempCode } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
const include = {
  test: {
    include: {
      sections: {
        include: {
          tasks: {
            include: {
              questions: true,
            },
          },
        },
      },
    },
  },
};
@Injectable()
export class TestTempCodeRepository {
  constructor(private readonly prisma: PrismaService) {}

  createTestTempCode(testId: string): Promise<TestTempCode> {
    const code = this.generateCode();
    return this.prisma.testTempCode.create({
      data: {
        code,
        test: { connect: { id: testId } },
      },
    });
  }

  deleteTestTempCodeByCode(code: number): Promise<TestTempCode | null> {
    return this.prisma.testTempCode.delete({
      where: {
        code,
      },
    });
  }

  getTestTempCode(code: number): Promise<TestTempCode | null> {
    return this.prisma.testTempCode.findUnique({
      where: {
        code,
      },
      include,
    });
  }

  getTestTempCodeByTestId(testId: string): Promise<TestTempCode | null> {
    return this.prisma.testTempCode.findUnique({
      where: {
        testId,
      },
    });
  }

  private generateCode(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }
}
