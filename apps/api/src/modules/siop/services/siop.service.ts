import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { SiopClientService } from './siop-client.service';
import { SiopEmendaResponse } from '../dto/siop-emenda.dto';

@Injectable()
export class SiopService {
  private readonly logger = new Logger(SiopService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly siopClient: SiopClientService,
  ) {}

  async syncEmendas(tenantId: string): Promise<{ processed: number; errors: number }> {
    this.logger.log(`Starting SIOP sync for tenant ${tenantId}`);

    const syncJob = await this.prisma.syncJob.create({
      data: {
        provider: 'SIOP',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      await this.prisma.syncJob.update({
        where: { id: syncJob.id },
        data: { status: 'FAILED', errorMessage: `Tenant ${tenantId} not found`, finishedAt: new Date() },
      });
      throw new Error(`Tenant ${tenantId} not found`);
    }

    try {
      // 1. Fetch data from SIOP
      // ... (rest of method)
      const query = `
        query GetEmendas($cnpj: String!) {
          emendas(cnpjBeneficiario: $cnpj) {
            codigoEmenda
            ano
            autor {
              nome
              partido
              uf
            }
            valorAtual
            objeto
            tipoEmenda
            situacao
            beneficiarios {
              nome
              cnpj
              valor
            }
            impedimentos {
              codigo
              descricao
              status
            }
          }
        }
      `;

      const data = await this.siopClient.query<{ emendas: SiopEmendaResponse[] }>(query, {
        cnpj: tenant.document,
      });

      let processed = 0;
      let errors = 0;

      for (const siopEmenda of data.emendas) {
        try {
          await this.syncSingleEmenda(tenantId, siopEmenda);
          processed++;
        } catch (err) {
          this.logger.error(`Failed to sync emenda ${siopEmenda.codigoEmenda}: ${err.message}`);
          errors++;
        }
      }

      await this.prisma.syncJob.update({
        where: { id: syncJob.id },
        data: {
          status: errors > 0 ? 'PARTIAL_SUCCESS' : 'COMPLETED',
          finishedAt: new Date(),
          recordsProcessed: processed,
        },
      });

      this.logger.log(`Sync completed for tenant ${tenantId}. Processed: ${processed}, Errors: ${errors}`);
      return { processed, errors };
    } catch (err) {
      await this.prisma.syncJob.update({
        where: { id: syncJob.id },
        data: { status: 'FAILED', errorMessage: err.message, finishedAt: new Date() },
      });
      this.logger.error(`SIOP Sync failed for tenant ${tenantId}: ${err.message}`);
      throw err;
    }
  }

  private async syncSingleEmenda(tenantId: string, data: SiopEmendaResponse) {
    // 1. Parliamentarian
    // We assume the author has a unique name+uf in SIOP or we use a composite key/name as identifier
    // Ideally SIOP has an author ID, but for now we use name as unique enough if combined with UF
    const parliamentarian = await this.prisma.parliamentarian.upsert({
      where: { externalId: `AUTOR-${data.autor.nome}-${data.autor.uf}` },
      create: {
        externalId: `AUTOR-${data.autor.nome}-${data.autor.uf}`,
        name: data.autor.nome,
        party: data.autor.partido,
        state: data.autor.uf,
      },
      update: {
        party: data.autor.partido,
        state: data.autor.uf,
      },
    });

    // 2. Emenda
    const emenda = await this.prisma.emenda.upsert({
      where: { externalId: data.codigoEmenda },
      create: {
        tenantId,
        parliamentarianId: parliamentarian.id,
        externalId: data.codigoEmenda,
        year: data.ano,
        number: data.codigoEmenda,
        type: data.tipoEmenda,
        object: data.objeto,
        amount: data.valorAtual,
        status: data.situacao,
        source: 'SIOP',
      },
      update: {
        amount: data.valorAtual,
        status: data.situacao,
        object: data.objeto,
      },
    });

    // 3. Beneficiaries
    for (const b of data.beneficiarios) {
      await this.prisma.beneficiary.upsert({
        where: {
          emendaId_document: {
            emendaId: emenda.id,
            document: b.cnpj,
          },
        },
        create: {
          emendaId: emenda.id,
          name: b.nome,
          document: b.cnpj,
          amount: b.valor,
        },
        update: {
          amount: b.valor,
          name: b.nome,
        },
      });
    }

    // 4. Impediments
    for (const imp of data.impedimentos) {
      await this.prisma.impediment.upsert({
        where: { externalId: imp.codigo },
        create: {
          emendaId: emenda.id,
          externalId: imp.codigo,
          description: imp.descricao,
          status: imp.status,
        },
        update: {
          status: imp.status,
          description: imp.descricao,
        },
      });
    }
  }
}
