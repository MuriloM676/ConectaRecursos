'use client';

import React, { useState } from 'react';
import { Building2, Plus, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Pagination } from '@/components/ui/pagination';
import { apiClient } from '@/lib/api/client';

export default function TenantsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['tenants', { page: currentPage, search }],
    queryFn: async () => {
      const res = await apiClient.get<any>('/tenants', {
        params: { page: currentPage, limit: 20, search },
      } as any);
      return res.data;
    },
  });

  const tenants = data?.items || [];
  const totalPages = data?.totalPages || 0;
  const totalItems = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500">Gerencie os municípios e organizações do sistema.</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-captagov-600 text-white rounded-lg hover:bg-captagov-700 transition-colors font-medium text-sm shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Novo Tenant
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tenant..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-captagov-500"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            Carregando...
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Building2 className="w-12 h-12 mb-3" />
            <p className="text-sm">Nenhum tenant encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">Documento</th>
                  <th className="px-6 py-3">Cidade</th>
                  <th className="px-6 py-3">UF</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tenants.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{t.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{t.document}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{t.city}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{t.state}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        t.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {t.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-sm font-medium text-captagov-600 hover:bg-captagov-50 px-3 py-1.5 rounded-lg transition-colors">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={20}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
