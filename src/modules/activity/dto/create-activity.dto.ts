import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ActionType, EntityType } from '@prisma/client';

export class CreateActivityDto {
  @ApiProperty({ enum: EntityType })
  @IsEnum(EntityType)
  @IsNotEmpty()
  entityType: EntityType;

  @ApiProperty({ enum: ActionType })
  @IsEnum(ActionType)
  @IsNotEmpty()
  actionType: ActionType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  actorId: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  targetId?: string;
} 