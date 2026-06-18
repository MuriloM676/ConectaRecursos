import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { StageResponseDto } from './dto/stage-response.dto';
import { CreateProgressDto } from './dto/create-progress.dto';
import { ProgressResponseDto } from './dto/progress-response.dto';
import { ConvenioProgressResponseDto } from './dto/convenio-progress-response.dto';

@Injectable()
export class PhysicalExecutionService {
  private readonly logger = new Logger(PhysicalExecutionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createStage(convenioId: string, dto: CreateStageDto): Promise<StageResponseDto> {
    const convenio = await this.prisma.convenio.findUnique({
      where: { id: convenioId, deletedAt: null },
    });
    if (!convenio) {
      throw new NotFoundException('Convenio not found');
    }

    const stage = await this.prisma.projectStage.create({
      data: {
        convenioId,
        name: dto.name,
        plannedPercentage: dto.plannedPercentage,
      },
    });

    this.logger.log(`Stage created: ${stage.id} (Convenio: ${convenioId})`);
    return StageResponseDto.fromPrisma(stage);
  }

  async getStages(convenioId: string): Promise<StageResponseDto[]> {
    const convenio = await this.prisma.convenio.findUnique({
      where: { id: convenioId, deletedAt: null },
    });
    if (!convenio) {
      throw new NotFoundException('Convenio not found');
    }

    const stages = await this.prisma.projectStage.findMany({
      where: { convenioId },
      include: {
        progress: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return stages.map((s) => StageResponseDto.fromPrisma(s));
  }

  async updateStage(stageId: string, dto: UpdateStageDto): Promise<StageResponseDto> {
    const stage = await this.prisma.projectStage.findUnique({
      where: { id: stageId },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    const updated = await this.prisma.projectStage.update({
      where: { id: stageId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.plannedPercentage !== undefined && { plannedPercentage: dto.plannedPercentage }),
      },
    });

    return StageResponseDto.fromPrisma(updated);
  }

  async deleteStage(stageId: string): Promise<void> {
    const stage = await this.prisma.projectStage.findUnique({
      where: { id: stageId },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    await this.prisma.projectStage.delete({ where: { id: stageId } });
    this.logger.log(`Stage deleted: ${stageId}`);
  }

  async recordProgress(dto: CreateProgressDto, userId?: string): Promise<ProgressResponseDto> {
    const stage = await this.prisma.projectStage.findUnique({
      where: { id: dto.stageId },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    if (dto.percentage > Number(stage.plannedPercentage)) {
      this.logger.warn(
        `Progress percentage (${dto.percentage}) exceeds planned percentage (${stage.plannedPercentage}) for stage ${dto.stageId}`,
      );
    }

    const progress = await this.prisma.projectProgress.create({
      data: {
        stageId: dto.stageId,
        percentage: dto.percentage,
        notes: dto.notes,
        createdBy: userId || null,
      },
      include: { stage: { select: { name: true } } },
    });

    await this.prisma.projectStage.update({
      where: { id: dto.stageId },
      data: { actualPercentage: dto.percentage },
    });

    this.logger.log(
      `Progress recorded: ${progress.id} (Stage: ${dto.stageId}, ${dto.percentage}%)`,
    );

    return ProgressResponseDto.fromPrisma(progress);
  }

  async getProgressHistory(stageId: string): Promise<ProgressResponseDto[]> {
    const stage = await this.prisma.projectStage.findUnique({
      where: { id: stageId },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    const records = await this.prisma.projectProgress.findMany({
      where: { stageId },
      include: { stage: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => ProgressResponseDto.fromPrisma(r));
  }

  async getConvenioProgress(convenioId: string): Promise<ConvenioProgressResponseDto> {
    const convenio = await this.prisma.convenio.findUnique({
      where: { id: convenioId, deletedAt: null },
    });
    if (!convenio) {
      throw new NotFoundException('Convenio not found');
    }

    const stages = await this.prisma.projectStage.findMany({
      where: { convenioId },
      include: {
        progress: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const allProgress = await this.prisma.projectProgress.findMany({
      where: { stage: { convenioId } },
      include: { stage: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return ConvenioProgressResponseDto.fromPrisma(convenioId, stages, allProgress);
  }
}
