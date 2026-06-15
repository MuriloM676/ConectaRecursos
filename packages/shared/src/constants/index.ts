export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN_MUNICIPAL: 'ADMIN_MUNICIPAL',
  GESTOR: 'GESTOR',
  OPERADOR: 'OPERADOR',
  VISUALIZADOR: 'VISUALIZADOR',
} as const;

export const RATE_LIMITS = {
  DEFAULT: 100, // requests per minute
  PUBLIC_API: 30, // requests per minute
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
  ],
} as const;
