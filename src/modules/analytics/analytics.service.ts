import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { Prisma } from '@prisma/client';

interface ParticipantResult {
  participantId: string;
  correctAnswersCount: number;
  totalQuestions: number;
  metrics: {
    accuracy: number;
    averageTimePerQuestion: number;
    performanceTrend: {
      questionIds: string[];
      correctness: boolean[];
    };
    totalTimeSpent: number;
    incorrectAnswersCount: number;
  };
}

interface TestResults {
  results: {
    [participantId: string]: ParticipantResult;
  };
  lastUpdated: Date;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateRange(startDate?: string, endDate?: string) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : startOfMonth(end);
    return { start, end };
  }

  private getPreviousPeriod(start: Date, end: Date) {
    const duration = end.getTime() - start.getTime();
    return {
      start: new Date(start.getTime() - duration),
      end: new Date(start.getTime() - 1),
    };
  }

  private async calculatePercentageChange(
    currentCount: number,
    previousCount: number,
  ): Promise<number> {
    if (previousCount === 0) return 0;
    return Math.round(((currentCount - previousCount) / previousCount) * 100);
  }

  private async getCreatedTestsStats(start: Date, end: Date) {
    const { start: prevStart, end: prevEnd } = this.getPreviousPeriod(start, end);

    const [currentPeriodCount, previousPeriodCount] = await Promise.all([
      this.prisma.test.count({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      }),
      this.prisma.test.count({
        where: {
          createdAt: {
            gte: prevStart,
            lte: prevEnd,
          },
        },
      }),
    ]);

    const percentageChange = await this.calculatePercentageChange(
      currentPeriodCount,
      previousPeriodCount,
    );

    return {
      currentPeriodCount,
      percentageChange,
      changePeriodDescription: 'from previous period',
    };
  }

  private async getParticipantsStats(start: Date, end: Date) {
    const { start: prevStart, end: prevEnd } = this.getPreviousPeriod(start, end);

    const [currentPeriodCount, previousPeriodCount] = await Promise.all([
      this.prisma.onlineTest.count({
        where: {
          startedAt: {
            gte: start,
            lte: end,
          },
        },
      }),
      this.prisma.onlineTest.count({
        where: {
          startedAt: {
            gte: prevStart,
            lte: prevEnd,
          },
        },
      }),
    ]);

    const percentageChange = await this.calculatePercentageChange(
      currentPeriodCount,
      previousPeriodCount,
    );

    return {
      currentPeriodCount,
      percentageChange,
      changePeriodDescription: 'from previous period',
    };
  }

  private async getCompletionRateStats(start: Date, end: Date) {
    const { start: prevStart, end: prevEnd } = this.getPreviousPeriod(start, end);

    const [currentPeriodStats, previousPeriodStats] = await Promise.all([
      this.prisma.onlineTest.findMany({
        where: {
          startedAt: {
            gte: start,
            lte: end,
          },
        },
        select: {
          finishedAt: true,
        },
      }),
      this.prisma.onlineTest.findMany({
        where: {
          startedAt: {
            gte: prevStart,
            lte: prevEnd,
          },
        },
        select: {
          finishedAt: true,
        },
      }),
    ]);

    const currentCompleted = currentPeriodStats.filter((test) => test.finishedAt).length;
    const currentTotal = currentPeriodStats.length;
    const previousCompleted = previousPeriodStats.filter((test) => test.finishedAt).length;
    const previousTotal = previousPeriodStats.length;

    const currentPercentage = currentTotal ? Math.round((currentCompleted / currentTotal) * 100) : 0;
    const previousPercentage = previousTotal ? Math.round((previousCompleted / previousTotal) * 100) : 0;

    const percentageChange = previousPercentage ? currentPercentage - previousPercentage : 0;

    return {
      currentPercentage,
      percentageChange,
      changePeriodDescription: 'from previous period',
    };
  }

  private parseResults(results: Prisma.JsonValue): TestResults | null {
    if (!results) return null;
    
    try {
      const parsed = typeof results === 'string' ? JSON.parse(results) : results;
      if (!parsed || typeof parsed !== 'object') return null;
      
      // Validate the structure
      if (!('results' in parsed) || !('lastUpdated' in parsed)) return null;
      if (typeof parsed.results !== 'object' || parsed.results === null) return null;
      
      return parsed as TestResults;
    } catch {
      return null;
    }
  }

  private calculateParticipantScore(result: ParticipantResult): number | null {
    if (result.totalQuestions === 0) return null;
    return (result.correctAnswersCount / result.totalQuestions) * 100;
  }

  private async getAverageScoreStats(start: Date, end: Date) {
    const { start: prevStart, end: prevEnd } = this.getPreviousPeriod(start, end);

    const [currentPeriodTests, previousPeriodTests] = await Promise.all([
      this.prisma.onlineTest.findMany({
        where: {
          finishedAt: {
            gte: start,
            lte: end,
          },
        },
        select: {
          results: true,
        },
      }),
      this.prisma.onlineTest.findMany({
        where: {
          finishedAt: {
            gte: prevStart,
            lte: prevEnd,
          },
        },
        select: {
          results: true,
        },
      }),
    ]);

    const calculateAverage = (tests: { results: Prisma.JsonValue }[]) => {
      const scores = tests
        .map((test) => {
          const results = this.parseResults(test.results);
          if (!results?.results) return null;

          // Calculate average score across all participants
          const participantScores = Object.values(results.results)
            .map(this.calculateParticipantScore)
            .filter((score): score is number => score !== null);

          return participantScores.length > 0
            ? participantScores.reduce((a, b) => a + b, 0) / participantScores.length
            : null;
        })
        .filter((score): score is number => score !== null);

      return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    };

    const currentAverage = calculateAverage(currentPeriodTests);
    const previousAverage = calculateAverage(previousPeriodTests);

    const percentageChange = previousAverage ? currentAverage - previousAverage : 0;

    return {
      currentPercentage: currentAverage,
      percentageChange,
      changePeriodDescription: 'from previous period',
    };
  }

  private async getTestActivityData(start: Date, end: Date) {
    const months = [];
    let currentDate = startOfMonth(start);
    const endOfEndMonth = endOfMonth(end);

    while (currentDate <= endOfEndMonth) {
      months.push(currentDate);
      currentDate = startOfMonth(subMonths(currentDate, -1));
    }

    const activityData = await Promise.all(
      months.map(async (monthStart) => {
        const monthEnd = endOfMonth(monthStart);
        const [createdTests, participants] = await Promise.all([
          this.prisma.test.count({
            where: {
              createdAt: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
          }),
          this.prisma.onlineTest.count({
            where: {
              startedAt: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
          }),
        ]);

        return {
          month: format(monthStart, 'MMMM'),
          createdTests,
          participants,
        };
      }),
    );

    return {
      labels: activityData.map((d) => d.month),
      datasets: [
        {
          label: 'Number of Created Tests',
          data: activityData.map((d) => d.createdTests),
        },
        {
          label: 'Number of Participants',
          data: activityData.map((d) => d.participants),
        },
      ],
    };
  }

  private async getLatestTests(limit: number) {
    const tests = await this.prisma.test.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        onlineTests: {
          select: {
            results: true,
          },
        },
      },
    });

    return tests.map((test) => {
      const scores = test.onlineTests
        .map((ot) => {
          const results = this.parseResults(ot.results);
          if (!results?.results) return null;

          // Calculate average score across all participants
          const participantScores = Object.values(results.results)
            .map(this.calculateParticipantScore)
            .filter((score): score is number => score !== null);

          return participantScores.length > 0
            ? participantScores.reduce((a, b) => a + b, 0) / participantScores.length
            : null;
        })
        .filter((score): score is number => score !== null);

      const averageScore = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      return {
        id: test.id,
        name: test.title,
        subject: test.subject,
        participantCount: test.onlineTests.length,
        averageScore,
        creationDate: format(test.createdAt, 'yyyy-MM-dd'),
      };
    });
  }

  async getDashboardStats(dto: DashboardStatsDto) {
    const { start, end } = this.getDateRange(dto.startDate, dto.endDate);

    const [
      createdTests,
      participants,
      completionRate,
      averageScore,
      testActivity,
      latestTests,
    ] = await Promise.all([
      this.getCreatedTestsStats(start, end),
      this.getParticipantsStats(start, end),
      this.getCompletionRateStats(start, end),
      this.getAverageScoreStats(start, end),
      this.getTestActivityData(start, end),
      this.getLatestTests(dto.limitLatestTests || 5),
    ]);

    return {
      dateRange: {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
      },
      overviewStats: {
        createdTests,
        participants,
        completionRate,
        averageScore,
      },
      testActivity,
      latestTests,
    };
  }
} 