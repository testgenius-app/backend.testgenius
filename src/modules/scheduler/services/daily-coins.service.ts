import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { NotificationChannel, NotificationPriority, NotificationType } from 'src/modules/notification/dto/notification.create.dto';
import { NotificationService } from 'src/modules/notification/notification.service';

@Injectable()
export class DailyCoinsService {
  private readonly logger = new Logger(DailyCoinsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async distributeDailyCoins() {
    try {
      this.logger.log('Starting daily coins distribution...');

      // Get all verified users
      const users = await this.prisma.user.findMany({
        where: {
          isVerified: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          coins: true,
        },
      });

      if (users.length === 0) {
        this.logger.log('No verified users found for daily coins distribution');
        return;
      }

      const DAILY_COINS_AMOUNT = +this.configService.get<number>('DAILY_COINS_AMOUNT', 10);
      let updatedCount = 0;

      // Update coins for each user
      for (const user of users) {
        try {
            if(user.coins + DAILY_COINS_AMOUNT <= 20) {
                await Promise.all([
                    this.prisma.user.update({
                        where: { id: user.id },
                        data: {
                          coins: {
                            increment: DAILY_COINS_AMOUNT,
                          },
                        },
                      }),
                      this.sendNotification(user.id),
                ])
                  updatedCount++;
                  this.logger.log(`Distributed ${DAILY_COINS_AMOUNT} coins to user ${user.email} (${user.firstName} ${user.lastName})`);
            }
        } catch (error) {
          this.logger.error(`Failed to distribute coins to user ${user.email}: ${error.message}`);
        }
      }

      this.logger.log(`Daily coins distribution completed. Updated ${updatedCount} out of ${users.length} users`);
    } catch (error) {
      this.logger.error(`Error during daily coins distribution: ${error.message}`);
      throw error;
    }
  }

  // Manual method to trigger daily coins distribution (for testing or admin use)
  async triggerDailyCoinsDistribution(): Promise<{ success: boolean; message: string; updatedCount: number }> {
    try {
      this.logger.log('Manual trigger: Starting daily coins distribution...');

      const users = await this.prisma.user.findMany({
        where: {
          isVerified: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          coins: true,
        },
      });

      if (users.length === 0) {
        return {
          success: true,
          message: 'No verified users found for daily coins distribution',
          updatedCount: 0,
        };
      }

      const DAILY_COINS_AMOUNT = this.configService.get<number>('DAILY_COINS_AMOUNT', 10);
      let updatedCount = 0;

      for (const user of users) {
        try {
            if(user.coins + DAILY_COINS_AMOUNT <= 20) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: {
              coins: {
                increment: DAILY_COINS_AMOUNT,
                },
              },
            });
          }
          updatedCount++;
        } catch (error) {
          this.logger.error(`Failed to distribute coins to user ${user.email}: ${error.message}`);
        }
      }

      const message = `Daily coins distribution completed. Updated ${updatedCount} out of ${users.length} users`;
      this.logger.log(message);

      return {
        success: true,
        message,
        updatedCount,
      };
    } catch (error) {
      const errorMessage = `Error during manual daily coins distribution: ${error.message}`;
      this.logger.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
        updatedCount: 0,
      };
    }
  }

  private async sendNotification(userId: string) {
    await this.notificationService.createNotification({
      title: 'BONUS: Sizga 10ta tanga sovg\'a qilindi!',
      message: 'Kydanza sizga 10ta tanga sovg\'a qildi!',
      type: NotificationType.SUCCESS,
      priority: NotificationPriority.HIGH,
      channel: NotificationChannel.WEB,
      userId: userId,
    }, 'user');
  }
} 