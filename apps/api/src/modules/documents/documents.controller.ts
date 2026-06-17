import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { DocumentResponseDto } from './dto/document-response.dto';
import { PaginationDto, PaginatedResult } from '@common/dto/pagination.dto';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { GetCurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Documentos')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Post('upload')
  @RequirePermissions('document:upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document', description: 'Uploads a file and associates it with an entity.' })
  @ApiResponse({ status: 201, type: DocumentResponseDto })
  async upload(
    @UploadedFile() file: any,
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
    @GetCurrentUser('sub') userId: string,
  ): Promise<DocumentResponseDto> {
    return this.service.upload(file, entityType, entityId, userId);
  }

  @Get()
  @RequirePermissions('document:read')
  @ApiOperation({ summary: 'List documents', description: 'Returns a paginated list of documents.' })
  @ApiResponse({ status: 200 })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ): Promise<PaginatedResult<DocumentResponseDto>> {
    return this.service.findAll({ ...pagination, entityType, entityId });
  }

  @Get(':id')
  @RequirePermissions('document:read')
  @ApiOperation({ summary: 'Get document metadata', description: 'Returns document metadata by ID.' })
  @ApiResponse({ status: 200, type: DocumentResponseDto })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async findById(@Param('id') id: string): Promise<DocumentResponseDto> {
    return this.service.findById(id);
  }

  @Get(':id/download')
  @RequirePermissions('document:read')
  @ApiOperation({ summary: 'Download document', description: 'Downloads the document file.' })
  @ApiResponse({ status: 200, description: 'File stream' })
  async download(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const { buffer, fileName, mimeType } = await this.service.download(id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(buffer);
  }

  @Delete(':id')
  @RequirePermissions('document:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete document', description: 'Soft deletes a document.' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
