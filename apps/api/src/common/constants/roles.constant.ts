export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN_MUNICIPAL = 'ADMIN_MUNICIPAL',
  GESTOR = 'GESTOR',
  OPERADOR = 'OPERADOR',
  VISUALIZADOR = 'VISUALIZADOR',
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 100,
  [Role.ADMIN_MUNICIPAL]: 80,
  [Role.GESTOR]: 60,
  [Role.OPERADOR]: 40,
  [Role.VISUALIZADOR]: 20,
};

export const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'Super Administrador',
  [Role.ADMIN_MUNICIPAL]: 'Administrador Municipal',
  [Role.GESTOR]: 'Gestor',
  [Role.OPERADOR]: 'Operador',
  [Role.VISUALIZADOR]: 'Visualizador',
};
