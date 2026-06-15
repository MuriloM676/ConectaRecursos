'use client';

import { QueryProvider } from './query-provider';
import { AuthProvider } from './auth-provider';
import { TenantProvider } from './tenant-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <TenantProvider>{children}</TenantProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
