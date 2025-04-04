import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerificationDto } from './dto/verification.dto';
import { ITokens } from 'src/core/types/tokens.type';
import { RefreshDto } from './dto/refresh.dto';
import { RestoreDto } from './dto/restore.dto';
import { ResultTokenDto } from './dto/result-token.dto';
import { JwtAuthGuard } from './auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { IUser } from 'src/core/types/iuser.type';
import { UserDto } from './dto/user.dto';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() registerDto: RegisterDto): Promise<ResultTokenDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login an existing user' })
  async login(@Body() loginDto: LoginDto): Promise<ITokens> {
    return this.authService.login(loginDto);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify user by code' })
  async verify(@Body() verificationDto: VerificationDto): Promise<ITokens> {
    return this.authService.verify(verificationDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() body: RefreshDto): Promise<ITokens> {
    return this.authService.refresh(body);
  }

  @Post('restore')
  @ApiOperation({ summary: 'Restore password' })
  async restore(@Body() body: RestoreDto): Promise<ResultTokenDto> {
    return this.authService.restore(body);
  }

  @Post('restore/verify')
  @ApiOperation({ summary: 'Verify restore password code' })
  async restoreVerify(@Body() body: VerificationDto): Promise<ITokens> {
    return this.authService.restoreVerify(body);
  }

  @Get('whoami')
  @ApiOperation({ summary: 'Get current user' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  whoami(@User() user: IUser): Promise<UserDto> {
    return this.authService.whoami(user);
  }
}
