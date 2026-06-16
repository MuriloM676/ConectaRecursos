import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ParliamentariansService } from './parliamentarians.service';
import { CreateParliamentarianDto } from './dto/create-parliamentarian.dto';
import { UpdateParliamentarianDto } from './dto/update-parliamentarian.dto';
import { ParliamentarianResponseDto } from './dto/parliamentarian-response.dto';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { Public } from '@common/decorators/public.decorator';

@ApiTags('Parliamentarians')
@ApiBearerAuth()
@Controller('parliamentarians')
export class ParliamentariansController {
  constructor(private readonly parliamentariansService: ParliamentariansService) {}

  @Post()
  @RequirePermissions('parliamentarian:create')
  @ApiOperation({ summary: 'Create a new parliamentarian' })
  @ApiResponse({ status: 201, type: ParliamentarianResponseDto })
  async create(@Body() dto: CreateParliamentarianDto): Promise<ParliamentarianResponseDto> {
    return this.parliamentariansService.create(dto);
  }

  @Get()
  @Public() // Or require permission if needed, but usually listing is public for authenticated users
  @ApiOperation({ summary: 'List all parliamentarians' })
  @ApiResponse({ status: 200, type: [ParliamentarianResponseDto] })
  async findAll(
    @Query('name') name?: string,
    @Query('party') party?: string,
    @Query('state') state?: string,
  ): Promise<ParliamentarianResponseDto[]> {
    return this.parliamentariansService.findAll({ name, party, state });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get parliamentarian by ID' })
  @ApiResponse({ status: 200, type: ParliamentarianResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findById(@Param('id') id: string): Promise<ParliamentarianResponseDto> {
    return this.parliamentariansService.findById(id);
  }

  @Put(':id')
  @RequirePermissions('parliamentarian:update')
  @ApiOperation({ summary: 'Update a parliamentarian' })
  @ApiResponse({ status: 200, type: ParliamentarianResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateParliamentarianDto,
  ): Promise<ParliamentarianResponseDto> {
    return this.parliamentariansService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('parliamentarian:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a parliamentarian' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.parliamentariansService.remove(id);
  }
}
