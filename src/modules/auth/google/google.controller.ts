import {
  Controller,
  Get,
  HttpStatus,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { GoogleOauthGuard } from '../guards/google.guard';
import { ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/decorators/user.decorator';
import { UserProfileDto } from './dto/user-profile.dto';
import { GoogleService } from './google.service';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@ApiTags('OAuth2')
@Controller({ path: '/auth/google' })
export class GoogleController {
  constructor(
    private readonly googleService: GoogleService,
    private readonly configService: ConfigService,
  ) {}

  @Get('')
  @UseGuards(GoogleOauthGuard)
  async googleAuth() {}

  @Get('callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthCallback(@User() user: UserProfileDto, @Res() res: Response) {
    return this.googleService
      .auth(user)
      .then((tokens) =>
        res.redirect(
          `${this.configService.get<string>('FRONTEND_URL')}/auth/callback/google?access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`,
        ),
      );
  }
}
