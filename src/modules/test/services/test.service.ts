import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs/promises';
import { CreateTestDto } from '../dto/create-test.dto';
import { UpdateTestDto } from '../dto/update-test.dto';
import { IUser } from 'src/core/types/iuser.type';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { TestRepository } from '../test.repository';
import { FilterDto } from '../dto/filter.dto';
import { DownloadDto } from '../dto/download.dto';
import { DocxService } from './docx/docx.service';
import { PdfService } from './pdf/pdf.service';
import { Test, User } from '@prisma/client';

enum FileType {
  DOCX = 'docx',
  PDF = 'pdf',
}

interface FileTypeConfig {
  contentType: string;
  generator: (test: any) => Promise<{ zipFilePath: string }>;
}

export interface IPagination {
  page: number;
  pages: number;
  limit: number;
  total: number;
}

@Injectable()
export class TestService {
  private readonly fileTypeHandlers: Record<FileType, FileTypeConfig>;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly testRepository: TestRepository,
    private readonly docxService: DocxService,
    private readonly pdfService: PdfService,
  ) {
    this.fileTypeHandlers = {
      [FileType.DOCX]: {
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        generator: this.docxService.generateDocx.bind(this.docxService),
      },
      [FileType.PDF]: {
        contentType: 'application/zip',
        generator: this.pdfService.generatePdf.bind(this.pdfService),
      },
    };
  }

  public async create(user: IUser, body: CreateTestDto): Promise<any> {
    await this.validateUser(user);
    return this.testRepository.createTest(body, user);
  }

  public async getTestById(id: string, user: IUser): Promise<any> {
    const test = await this.testRepository.getTestById(id);
    this.validateTestOwnership(test, user);
    return test;
  }

  public async getTestsByOwnerId(
    user: IUser,
    filterDto: FilterDto,
  ): Promise<{ tests: Test[]; pagination: IPagination }> {
    const { tests, count } = await this.testRepository.getTestsByOwnerId(user.id, filterDto);
    const pages = Math.ceil(count / filterDto.limit);
    const pagination: IPagination = {
      page: filterDto.page,
      pages,
      limit: filterDto.limit,
      total: count,
    };
    return { tests, pagination };
  }

  public async downloadTest(
    user: IUser,
    query: DownloadDto,
    res: Response,
  ): Promise<void> {
    const { testId, type } = query;
    const test = await this.testRepository.getTestById(testId);
    this.validateTestOwnership(test, user);

    const handler = this.fileTypeHandlers[type as FileType];
    if (!handler) {
      throw new NotFoundException('Unsupported file type');
    }

    try {
      const { zipFilePath } = await handler.generator(test);
      await this.sendFile(res, zipFilePath, handler.contentType, test.id);
    } catch (error) {
      throw new Error(`Error generating ${type} file: ${error.message}`);
    }
  }

  private async sendFile(
    res: Response,
    filePath: string,
    contentType: string,
    testId: string,
  ): Promise<void> {
    try {
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${testId}_test.zip`,
      );

      await new Promise<void>((resolve, reject) => {
        res.sendFile(filePath, (err) => {
          if (err) {
            reject(new Error('Error sending file'));
          }
          resolve();
        });
      });

      await fs.unlink(filePath);
    } catch (error) {
      await fs
        .unlink(filePath)
        .catch((err) => console.error(`Error deleting file ${filePath}:`, err));
      throw new Error(`Error handling file: ${error.message}`);
    }
  }

  private validateTestOwnership(test: any, user: IUser): void {
    if (!test || test.ownerId !== user.id) {
      throw new NotFoundException('Test not found');
    }
  }

  private async validateUser(user: IUser): Promise<User> {
    if (!user.id) {
      throw new UnauthorizedException('Unauthorized');
    }
    const validUser = await this.prismaService.user.findUnique({
      where: { id: user.id },
    });
    if (!validUser) {
      throw new UnauthorizedException('User not found');
    }
    return validUser;
  }

  public async updateTest(
    id: string,
    user: IUser,
    data: UpdateTestDto,
  ): Promise<Test> {
    await this.validateUser(user);
    const test = await this.testRepository.getTestById(id);
    this.validateTestOwnership(test, user);
    return this.testRepository.updateTest(id, data);
  }

  public async deleteTest(id: string, user: IUser): Promise<Test> {
    await this.validateUser(user);
    const test = await this.testRepository.getTestById(id);
    this.validateTestOwnership(test, user);
    return this.testRepository.deleteTest(id);
  }
}
