'use client';

import React, { useState } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Pagination } from '@/components/ui/pagination';
import { apiClient } from '@/lib/api/client';

export default function ParliamentariansPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['parliamentarians', { page: currentPage, search }],
    queryFn: async () => {
      const res = await apiClient.get<any>('/parliamentarians', {
        params: { page: currentPage, limit: 20, search },
      } as any);
      return res.data;
    },
  });

  const parliamentarians = data?.items || [];
  const totalPages = data?.totalPages || 0;
  const totalItems = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parlamentares</h1>
          <p className="text-sm text-gray-500">Gerencie os parlamentares do sistema.</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-captagov-600 text-white rounded-lg hover:bg-captagov-700 transition-colors font-medium text-sm shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Novo Parlamentar
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar parlamentar..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-captagov-500"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            Carregando...
          </div>
        ) : parliamentarians.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Users className="w-12 h-12 mb-3" />
            <p className="text-sm">Nenhum parlamentar encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
                  <th className="px-6 py-3">Nome</th>
                  <th className="px-6 py-3">Partido</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3">Mandato</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parliamentarians.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{p.party}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{p.state}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{p.termStart?.split('T')[0]} - {p.termEnd?.split('T')[0]}</td>
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
