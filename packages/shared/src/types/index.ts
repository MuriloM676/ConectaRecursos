export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  timestamp: string;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TokenPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TenantDTO {
  id: string;
  name: string;
  document: string;
  city?: string;
  state?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserDTO {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface EmendaDTO {
  id: string;
  tenantId: string;
  parliamentarianId: string;
  parliamentarianName?: string;
  externalId?: string;
  year: number;
  number: string;
  type: string;
  object: string;
  amount: number;
  status: string;
  source: string;
  createdAt: string;
}

export interface ParliamentarianDTO {
  id: string;
  name: string;
  party: string;
  state: string;
}

export interface ConvenioDTO {
  id: string;
  tenantId: string;
  emendaId: string;
  number: string;
  object: string;
  totalAmount: number;
  counterpartAmount: number;
  startDate?: string;
  endDate?: string;
  status: string;
}

export interface ImpedimentDTO {
  id: string;
  emendaId: string;
  externalId?: string;
  description: string;
  status: string;
  openedAt: string;
  resolvedAt?: string;
}

export interface DashboardOverviewDTO {
  capturedAmount: number;
  receivedAmount: number;
  executedAmount: number;
}

export interface DocumentDTO {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  fileName: string;
  mimeType: string;
  version: number;
  uploadedBy: string;
}
