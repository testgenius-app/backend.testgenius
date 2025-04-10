import { BadRequestException, Injectable } from '@nestjs/common';
import { TestTempCodeRepository } from './test-temp-code.repository';
import { TestTempCode } from '@prisma/client';

@Injectable()
export class TestTempCodeService {
  constructor(
    private readonly testTempCodeRepository: TestTempCodeRepository,
  ) {}

  async createTestTempCode(testId: string): Promise<TestTempCode> {
    const existingCode =
      await this.testTempCodeRepository.getTestTempCodeByTestId(testId);

    if (existingCode && existingCode.expiresAt > new Date()) {
      return existingCode;
    } else if (existingCode && existingCode.expiresAt < new Date()) {
      await this.testTempCodeRepository.deleteTestTempCodeByCode(
        existingCode.code,
      );
      throw new BadRequestException('Test temp code expired');
    }

    return this.testTempCodeRepository.createTestTempCode(testId);
  }

  deleteTestTempCodeByCode(code: number): Promise<TestTempCode | null> {

    return this.testTempCodeRepository.deleteTestTempCodeByCode(code);
  }

  async getTestTempCode(code: number): Promise<TestTempCode | null> {
    const tempCode = await this.testTempCodeRepository.getTestTempCode(code);
    if (!tempCode) {
      throw new BadRequestException('Invalid test temp code');
    }
    return tempCode;
  }

  async getTestTempCodeByTestId(testId: string): Promise<TestTempCode | null> {
    return this.testTempCodeRepository.getTestTempCodeByTestId(testId);
  }
}
