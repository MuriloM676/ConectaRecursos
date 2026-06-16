import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { CreateParliamentarianDto } from './dto/create-parliamentarian.dto';
import { UpdateParliamentarianDto } from './dto/update-parliamentarian.dto';
import { ParliamentarianResponseDto } from './dto/parliamentarian-response.dto';

@Injectable()
export class ParliamentariansService {
  private readonly logger = new Logger(ParliamentariansService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateParliamentarianDto): Promise<ParliamentarianResponseDto> {
    const parliamentarian = await this.prisma.parliamentarian.create({
      data: dto,
    });

    this.logger.log(`Parliamentarian created: ${parliamentarian.name}`);
    return ParliamentarianResponseDto.fromPrisma(parliamentarian);
  }

  async findAll(query?: { name?: string; party?: string; state?: string }): Promise<ParliamentarianResponseDto[]> {
    const parliamentarians = await this.prisma.parliamentarian.findMany({
      where: {
        name: query?.name ? { contains: query.name, mode: 'insensitive' } : undefined,
        party: query?.party ? { contains: query.party, mode: 'insensitive' } : undefined,
        state: query?.state ? { equals: query.state, mode: 'insensitive' } : undefined,
      },
      orderBy: { name: 'asc' },
    });

    return parliamentarians.map(p => ParliamentarianResponseDto.fromPrisma(p));
  }

  async findById(id: string): Promise<ParliamentarianResponseDto> {
    const parliamentarian = await this.prisma.parliamentarian.findUnique({
      where: { id },
    });

    if (!parliamentarian) {
      throw new NotFoundException('Parliamentarian not found');
    }

    return ParliamentarianResponseDto.fromPrisma(parliamentarian);
  }

  async update(id: string, dto: UpdateParliamentarianDto): Promise<ParliamentarianResponseDto> {
    const parliamentarian = await this.prisma.parliamentarian.findUnique({
      where: { id },
    });

    if (!parliamentarian) {
      throw new NotFoundException('Parliamentarian not found');
    }

    const updated = await this.prisma.parliamentarian.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Parliamentarian updated: ${updated.name}`);
    return ParliamentarianResponseDto.fromPrisma(updated);
  }

  async remove(id: string): Promise<void> {
    const parliamentarian = await this.prisma.parliamentarian.findUnique({
      where: { id },
    });

    if (!parliamentarian) {
      throw new NotFoundException('Parliamentarian not found');
    }

    // Check for dependencies (Emendas)
    const emendaCount = await this.prisma.emenda.count({
      where: { parliamentarianId: id },
    });

    if (emendaCount > 0) {
      throw new Error(`Cannot delete parliamentarian with ${emendaCount} emendas assigned`);
    }

    await this.prisma.parliamentarian.delete({
      where: { id },
    });

    this.logger.log(`Parliamentarian deleted: ${id}`);
  }
}
