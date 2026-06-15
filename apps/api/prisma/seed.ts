import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ==================== Roles ====================
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: {
        name: 'SUPER_ADMIN',
        description: 'Super Administrador do Sistema',
      },
    }),
    prisma.role.upsert({
      where: { name: 'ADMIN_MUNICIPAL' },
      update: {},
      create: {
        name: 'ADMIN_MUNICIPAL',
        description: 'Administrador Municipal',
      },
    }),
    prisma.role.upsert({
      where: { name: 'GESTOR' },
      update: {},
      create: {
        name: 'GESTOR',
        description: 'Gestor',
      },
    }),
    prisma.role.upsert({
      where: { name: 'OPERADOR' },
      update: {},
      create: {
        name: 'OPERADOR',
        description: 'Operador',
      },
    }),
    prisma.role.upsert({
      where: { name: 'VISUALIZADOR' },
      update: {},
      create: {
        name: 'VISUALIZADOR',
        description: 'Visualizador',
      },
    }),
  ]);

  console.log(`✅ ${roles.length} roles created`);

  // ==================== Permissions ====================
  const permissionCodes = [
    'auth:login', 'auth:refresh',
    'tenant:create', 'tenant:read', 'tenant:update', 'tenant:delete',
    'user:create', 'user:read', 'user:update', 'user:delete',
    'role:create', 'role:read', 'role:update', 'role:delete',
    'emenda:create', 'emenda:read', 'emenda:update', 'emenda:delete', 'emenda:history',
    'parliamentarian:create', 'parliamentarian:read', 'parliamentarian:update', 'parliamentarian:delete',
    'siop:sync', 'siop:read', 'siop:reprocess',
    'impediment:create', 'impediment:read', 'impediment:update', 'impediment:delete',
    'convenio:create', 'convenio:read', 'convenio:update', 'convenio:delete',
    'financial_schedule:create', 'financial_schedule:read', 'financial_schedule:update',
    'physical_execution:create', 'physical_execution:read', 'physical_execution:update',
    'accountability:create', 'accountability:read', 'accountability:update', 'accountability:approve', 'accountability:reject',
    'document:upload', 'document:read', 'document:delete',
    'alert:read', 'alert:manage',
    'dashboard:read',
    'report:generate', 'report:read',
    'audit_log:read',
    'integration:create', 'integration:read', 'integration:update', 'integration:delete',
    'public_api:access',
  ];

  const permissions = await Promise.all(
    permissionCodes.map((code) =>
      prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, description: code },
      }),
    ),
  );

  console.log(`✅ ${permissions.length} permissions created`);

  // ==================== Super Admin Role Permissions ====================
  const superAdminRole = roles.find((r) => r.name === 'SUPER_ADMIN')!;
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✅ Super Admin permissions assigned');

  // ==================== Default Tenant ====================
  const tenant = await prisma.tenant.upsert({
    where: { document: '00000000000000' },
    update: {},
    create: {
      name: 'CaptaGov Admin',
      document: '00000000000000',
      city: 'São Paulo',
      state: 'SP',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Default tenant: ${tenant.name}`);

  // ==================== Super Admin User ====================
  const passwordHash = await bcrypt.hash('Admin@123', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@captagov.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      roleId: superAdminRole.id,
      name: 'Super Admin',
      email: 'admin@captagov.com',
      passwordHash,
      active: true,
    },
  });

  console.log(`✅ Super Admin user: ${superAdmin.email}`);
  console.log('🔑 Default credentials: admin@captagov.com / Admin@123');
  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
