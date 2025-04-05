import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';

@ApiTags('Test')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'test', version: '1' })
export class TestController {}
