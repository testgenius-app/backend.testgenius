import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupTemporaryData() {
    try {
      this.logger.log('Starting cleanup of temporary data...');

      // Get current date in UTC
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      // Cleanup OnlineTest records
      const deletedOnlineTests = await this.prisma.onlineTest.deleteMany({
        where: {
          OR: [
            { createdAt: { lt: yesterday } },
            { finishedAt: { lt: yesterday } },
          ],
        },
      });
      this.logger.log(`Deleted ${deletedOnlineTests.count} OnlineTest records`);

      // Cleanup VerificationCode records
      const deletedVerificationCodes = await this.prisma.verificationCode.deleteMany({
        where: {
          createdAt: { lt: yesterday },
        },
      });
      this.logger.log(`Deleted ${deletedVerificationCodes.count} VerificationCode records`);

      // Cleanup TestTempCode records
      const deletedTestTempCodes = await this.prisma.testTempCode.deleteMany({
        where: {
          createdAt: { lt: yesterday },
        },
      });
      this.logger.log(`Deleted ${deletedTestTempCodes.count} TestTempCode records`);

      this.logger.log('Cleanup completed successfully');
    } catch (error) {
      this.logger.error(`Error during cleanup: ${error.message}`);
      throw error;
    }
  }
} 