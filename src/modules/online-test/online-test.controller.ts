import { Controller, UseGuards } from '@nestjs/common';
import { OnlineTestService } from './online-test.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
@ApiTags('Online Test')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'online-test', version: '1' })
export class OnlineTestController {
  constructor(private readonly onlineTestService: OnlineTestService) {}
}
