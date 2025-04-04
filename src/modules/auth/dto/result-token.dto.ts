import { ApiProperty } from '@nestjs/swagger';

export class ResultTokenDto {
  @ApiProperty({ example: 'OK', description: 'Result of operation' })
  result: string;

  @ApiProperty({ example: 'token', description: 'Token' })
  token: string;
}
