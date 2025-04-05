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
import { ITokens } from 'src/core/types/tokens.type';
@ApiTags('OAuth2')
@Controller({ path: '/auth/google' })
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Get('')
  @UseGuards(GoogleOauthGuard)
  async googleAuth() {}

  @Get('callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthCallback(@User() user: UserProfileDto): Promise<ITokens> {
    console.log(user);
    return this.googleService.auth(user);
  }
}
