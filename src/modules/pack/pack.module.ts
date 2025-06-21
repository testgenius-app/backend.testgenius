import { Module } from '@nestjs/common';
import { PackController } from './pack.controller';
import { PackService } from './pack.service';
import { PackRepository } from './pack.repository';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

/**
 * Pack module for managing coin packs
 * @description Provides pack management functionality including CRUD operations,
 * filtering, and role-based access control
 */
@Module({
  imports: [PrismaModule],
  controllers: [PackController],
  providers: [PackService, PackRepository, PrismaService, JwtService],
  exports: [PackService], // Export service for use in other modules
})
export class PackModule {}
