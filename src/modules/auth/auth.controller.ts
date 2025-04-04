import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerificationDto } from './dto/verification.dto';
import { ITokens } from 'src/core/types/tokens.type';
import { RefreshDto } from './dto/refresh.dto';
import { RestoreDto } from './dto/restore.dto';
import { ResultTokenDto } from './dto/result-token.dto';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<ResultTokenDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<ITokens> {
    return this.authService.login(loginDto);
  }

  @Post('verify')
  async verify(@Body() verificationDto: VerificationDto): Promise<ITokens> {
    return this.authService.verify(verificationDto);
  }

  @Post('refresh')
  async refresh(@Body() body: RefreshDto): Promise<ITokens> {
    return this.authService.refresh(body);
  }

  @Post('restore')
  async restore(@Body() body: RestoreDto): Promise<ResultTokenDto> {
    return this.authService.restore(body);
  }

  @Post('restore/verify')
  async restoreVerify(@Body() body: VerificationDto): Promise<ITokens> {
    return this.authService.restoreVerify(body);
  }
}
