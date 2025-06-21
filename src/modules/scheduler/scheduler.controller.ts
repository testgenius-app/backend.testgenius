import { Controller, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { DailyCoinsService } from './services/daily-coins.service';
import { User } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('scheduler')
@UseGuards(JwtAuthGuard)
export class SchedulerController {
  constructor(private readonly dailyCoinsService: DailyCoinsService) {}

  @Post('trigger-daily-coins')
  @HttpCode(HttpStatus.OK)
  async triggerDailyCoins(@User() user: any) {
    // Only allow admins to trigger this manually
    if (user.role !== 'ADMIN') {
      throw new Error('Unauthorized: Only admins can trigger daily coins distribution');
    }

    return await this.dailyCoinsService.triggerDailyCoinsDistribution();
  }
} 