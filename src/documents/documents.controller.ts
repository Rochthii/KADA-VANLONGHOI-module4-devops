import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { DocumentQueryDto } from './dto/document-query.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { DocumentsService } from './documents.service';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document for a user' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId', 'file'],
      properties: {
        userId: { type: 'string', format: 'uuid' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadDocumentDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.documentsService.upload(dto.userId, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get documents belonging to a user' })
  @ApiQuery({ name: 'userId', type: String, format: 'uuid' })
  findByUser(@Query() query: DocumentQueryDto) {
    return this.documentsService.findByUser(query.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document metadata by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findById(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a document by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const result = await this.documentsService.download(id);
    response.setHeader('Content-Type', result.document.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(result.document.originalFilename)}`,
    );
    response.setHeader('Content-Length', String(result.document.size));
    return new StreamableFile(result.body);
  }

  @Delete(':id')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Delete a document by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.remove(id);
  }
}
