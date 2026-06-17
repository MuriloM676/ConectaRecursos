import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data...');

  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error('❌ No tenant found. Run db:seed first.');
    process.exit(1);
  }

  // ==================== Parliamentarians ====================
  const parliamentarians = await Promise.all([
    prisma.parliamentarian.upsert({
      where: { externalId: 'DEP-001' },
      update: {},
      create: { externalId: 'DEP-001', name: 'Maria da Silva', party: 'PT', state: 'SP' },
    }),
    prisma.parliamentarian.upsert({
      where: { externalId: 'DEP-002' },
      update: {},
      create: { externalId: 'DEP-002', name: 'João Santos', party: 'PSDB', state: 'MG' },
    }),
    prisma.parliamentarian.upsert({
      where: { externalId: 'DEP-003' },
      update: {},
      create: { externalId: 'DEP-003', name: 'Carlos Oliveira', party: 'PL', state: 'RJ' },
    }),
    prisma.parliamentarian.upsert({
      where: { externalId: 'DEP-004' },
      update: {},
      create: { externalId: 'DEP-004', name: 'Ana Beatriz Costa', party: 'MDB', state: 'BA' },
    }),
    prisma.parliamentarian.upsert({
      where: { externalId: 'DEP-005' },
      update: {},
      create: { externalId: 'DEP-005', name: 'Pedro Almeida', party: 'UNIÃO', state: 'RS' },
    }),
    prisma.parliamentarian.upsert({
      where: { externalId: 'DEP-006' },
      update: {},
      create: { externalId: 'DEP-006', name: 'Luciana Mendes', party: 'PSD', state: 'CE' },
    }),
  ]);
  console.log(`✅ ${parliamentarians.length} parliamentarians created`);

  // ==================== Emendas ====================
  const emendas = await Promise.all([
    prisma.emenda.upsert({
      where: { externalId: 'EM20260001' },
      update: {},
      create: {
        tenantId: tenant.id,
        parliamentarianId: parliamentarians[0].id,
        externalId: 'EM20260001',
        year: 2026,
        number: '20260001',
        type: 'INDIVIDUAL',
        object: 'Aquisição de ambulâncias para atendimento básico no município de Avaré-SP',
        amount: 500000,
        status: 'APROVADA',
        source: 'MANUAL',
      },
    }),
    prisma.emenda.upsert({
      where: { externalId: 'EM20260002' },
      update: {},
      create: {
        tenantId: tenant.id,
        parliamentarianId: parliamentarians[1].id,
        externalId: 'EM20260002',
        year: 2026,
        number: '20260002',
        type: 'INDIVIDUAL',
        object: 'Construção de creche municipal no bairro Jardim América',
        amount: 1200000,
        status: 'APROVADA',
        source: 'MANUAL',
      },
    }),
    prisma.emenda.upsert({
      where: { externalId: 'EM20260003' },
      update: {},
      create: {
        tenantId: tenant.id,
        parliamentarianId: parliamentarians[2].id,
        externalId: 'EM20260003',
        year: 2026,
        number: '20260003',
        type: 'INDIVIDUAL',
        object: 'Pavimentação asfáltica de vias urbanas no distrito industrial',
        amount: 800000,
        status: 'EMPENHADA',
        source: 'MANUAL',
      },
    }),
    prisma.emenda.upsert({
      where: { externalId: 'EM20260004' },
      update: {},
      create: {
        tenantId: tenant.id,
        parliamentarianId: parliamentarians[3].id,
        externalId: 'EM20260004',
        year: 2026,
        number: '20260004',
        type: 'INDIVIDUAL',
        object: 'Implantação de sistema de captação de água pluvial em escolas municipais',
        amount: 350000,
        status: 'PENDENTE',
        source: 'MANUAL',
      },
    }),
    prisma.emenda.upsert({
      where: { externalId: 'EM20260005' },
      update: {},
      create: {
        tenantId: tenant.id,
        parliamentarianId: parliamentarians[4].id,
        externalId: 'EM20260005',
        year: 2026,
        number: '20260005',
        type: 'INDIVIDUAL',
        object: 'Modernização da iluminação pública com lâmpadas LED',
        amount: 650000,
        status: 'APROVADA',
        source: 'MANUAL',
      },
    }),
    prisma.emenda.upsert({
      where: { externalId: 'EM20260006' },
      update: {},
      create: {
        tenantId: tenant.id,
        parliamentarianId: parliamentarians[5].id,
        externalId: 'EM20260006',
        year: 2026,
        number: '20260006',
        type: 'BANCADA',
        object: 'Recuperação de estradas vicinais para escoamento da produção agrícola',
        amount: 2000000,
        status: 'PENDENTE',
        source: 'MANUAL',
      },
    }),
  ]);
  console.log(`✅ ${emendas.length} emendas created`);

  // ==================== Beneficiaries ====================
  const beneficiaries = [
    { emendaId: emendas[0].id, name: 'Prefeitura Municipal de Avaré', document: '46456789000123', amount: 500000 },
    { emendaId: emendas[1].id, name: 'Secretaria Municipal de Educação', document: '46456789000124', amount: 1200000 },
    { emendaId: emendas[2].id, name: 'Secretaria Municipal de Obras', document: '46456789000125', amount: 800000 },
    { emendaId: emendas[3].id, name: 'Secretaria Municipal do Meio Ambiente', document: '46456789000126', amount: 350000 },
    { emendaId: emendas[4].id, name: 'Secretaria Municipal de Serviços Urbanos', document: '46456789000127', amount: 650000 },
    { emendaId: emendas[5].id, name: 'Secretaria Municipal de Agricultura', document: '46456789000128', amount: 2000000 },
  ];

  for (const b of beneficiaries) {
    await prisma.beneficiary.upsert({
      where: { emendaId_document: { emendaId: b.emendaId, document: b.document } },
      update: {},
      create: b,
    });
  }
  console.log(`✅ ${beneficiaries.length} beneficiaries created`);

  // ==================== Impediments ====================
  const impediments = [
    { emendaId: emendas[1].id, externalId: 'IMP-001', description: 'Documentação do terreno incompleta (matrícula atualizada)', status: 'OPEN' },
    { emendaId: emendas[1].id, externalId: 'IMP-002', description: 'Licença ambiental pendente', status: 'OPEN' },
    { emendaId: emendas[2].id, externalId: 'IMP-003', description: 'Estudo de impacto de trânsito não aprovado', status: 'RESOLVED' },
    { emendaId: emendas[4].id, externalId: 'IMP-004', description: 'Parecer técnico do CREA pendente', status: 'OPEN' },
  ];

  for (const imp of impediments) {
    await prisma.impediment.upsert({
      where: { externalId: imp.externalId },
      update: {},
      create: imp,
    });
  }
  console.log(`✅ ${impediments.length} impediments created`);

  // ==================== Convênios ====================
  const convenios = await Promise.all([
    prisma.convenio.create({
      data: {
        tenantId: tenant.id,
        emendaId: emendas[0].id,
        number: 'CV20260001',
        object: 'Aquisição de 2 ambulâncias UTI móvel',
        totalAmount: 500000,
        counterpartAmount: 25000,
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-12-31'),
        status: 'ACTIVE',
      },
    }),
    prisma.convenio.create({
      data: {
        tenantId: tenant.id,
        emendaId: emendas[1].id,
        number: 'CV20260002',
        object: 'Construção de creche com capacidade para 200 crianças',
        totalAmount: 1200000,
        counterpartAmount: 60000,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2027-06-30'),
        status: 'ACTIVE',
      },
    }),
  ]);
  console.log(`✅ ${convenios.length} convênios created`);

  // ==================== Financial Schedule ====================
  for (const cv of convenios) {
    const monthlyAmount = Math.round(Number(cv.totalAmount) / 6);
    for (let i = 1; i <= 6; i++) {
      const month = i + 1;
      const date = new Date(2026, month, 1);
      const received = i <= 2;
      await prisma.convenioFinancialSchedule.create({
        data: {
          convenioId: cv.id,
          expectedAmount: monthlyAmount,
          expectedDate: date,
          receivedAmount: received ? monthlyAmount : null,
          receivedDate: received ? date : null,
          status: received ? 'RECEIVED' : 'PENDING',
        },
      });
    }
  }
  console.log(`✅ Financial schedules created`);

  // ==================== Alerts ====================
  await prisma.alert.createMany({
    data: [
      { tenantId: tenant.id, type: 'INFO', title: 'Bem-vindo ao CaptaGov', description: 'Sistema configurado com sucesso. Explore o dashboard para acompanhar suas emendas.' },
      { tenantId: tenant.id, type: 'WARNING', title: 'Impedimento pendente', description: 'A emenda EM20260002 possui 2 impedimentos em aberto que precisam de ação.' },
      { tenantId: tenant.id, type: 'SUCCESS', title: 'Convênio assinado', description: 'O convênio CV20260001 foi assinado e está ativo.' },
    ],
  });
  console.log('✅ Alerts created');

  console.log('🌱 Demo data seeding complete!');
  console.log('📊 Login at http://localhost:3000/login with admin@captagov.com / Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Demo seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
