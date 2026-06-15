'use client';

import { createContext, useContext } from 'react';
import { useAuth } from './auth-provider';

interface TenantContextType {
  tenantId: string | null;
  tenantName: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  tenantName: null,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const value: TenantContextType = {
    tenantId: user?.tenantId || null,
    tenantName: null, // Will be populated from tenant API
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
