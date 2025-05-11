import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsUUID } from 'class-validator';

export class DownloadDto {
  @ApiProperty({ description: 'The ID of the test' })
  @IsUUID()
  testId: string;

  @ApiProperty({ description: 'The type of file to download', enum: ['pdf', 'docx'] })
  @IsString()
  @IsIn(['pdf', 'docx'])
  type: 'pdf' | 'docx';
}
