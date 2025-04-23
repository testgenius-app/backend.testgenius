import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { TokenService } from './token.service';
import { AuthRepository } from './auth.repository';
import { VerificationService } from './verification.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerificationDto } from './dto/verification.dto';
import { ITokens } from 'src/core/types/tokens.type';
import { RefreshDto } from './dto/refresh.dto';
import { RestoreDto } from './dto/restore.dto';
import { ResultTokenDto } from './dto/result-token.dto';
import { UtilsService } from 'src/core/utils/utils.service';
import { IUser } from 'src/core/types/iuser.type';
import { User } from 'src/common/decorators/user.decorator';
import { UserDto } from './dto/user.dto';

// TODO: add logging
@Injectable()
export class AuthService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly authRepository: AuthRepository,
    private readonly verificationService: VerificationService,
    private readonly utilsService: UtilsService,
  ) {}

  async register(body: RegisterDto): Promise<ResultTokenDto> {
    try {
      const existingUser = await this.authRepository.findUserByEmail(
        body.email,
      );

      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      const verificationCode =
        await this.verificationService.createVerificationCode(body);

      return {
        result: 'OK',
        token: verificationCode.token,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async login(body: LoginDto): Promise<ITokens> {
    try {
      const user = await this.authRepository.findUserByEmail(body.email);

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const isPasswordMatch = await this.utilsService.comparePassword(
        body.password,
        user.password,
      );

      if (!isPasswordMatch) {
        throw new BadRequestException('Invalid password');
      }

      return this.tokenService.generateTokens(user.id);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async verify(body: VerificationDto): Promise<ITokens> {
    try {
      const code = await this.verificationService.verifyVerificationCode(body);

      const user = await this.authRepository.createUser(code);

      return this.tokenService.generateTokens(user.id);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async refresh(body: RefreshDto): Promise<ITokens> {
    try {
      const { userId } = await this.tokenService.verifyRefreshToken(
        body.refreshToken,
      );

      return this.tokenService.generateTokens(userId);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async restore(body: RestoreDto): Promise<ResultTokenDto> {
    try {
      const user = await this.authRepository.findUserByEmail(body.email);

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const verificationCode =
        await this.verificationService.createRestoreVerificationCode(user);

      return {
        result: 'OK',
        token: verificationCode.token,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async restoreVerify(body: VerificationDto): Promise<ITokens> {
    try {
      const code = await this.verificationService.verifyVerificationCode(body);

      const user = await this.authRepository.findUserByEmail(code.email);

      if (!user) {
        throw new BadRequestException('User not found');
      }

      return this.tokenService.generateTokens(user.id);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async whoami(@User() userData: IUser): Promise<UserDto> {
    try {
      const user = await this.authRepository.getUserById(userData.id);

      if (!user) {
        throw new BadRequestException('User not found');
      }

      delete user.password;
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
