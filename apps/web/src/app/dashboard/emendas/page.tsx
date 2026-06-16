'use client';

import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmendaForm } from '@/components/emendas/emenda-form';
import { EmendaTable, Emenda } from '@/components/emendas/emenda-table';
import { Pagination } from '@/components/ui/pagination';
import { apiClient } from '@/lib/api/client';

export default function EmendasPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmenda, setEditingEmenda] = useState<Emenda | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<number | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['emendas', { page: currentPage, search: searchTerm, year: yearFilter }],
    queryFn: async () => {
      const response = await apiClient.get<any>('/emendas', {
        params: {
          page: currentPage,
          limit: 20,
          search: searchTerm,
          year: yearFilter !== 'ALL' ? yearFilter : undefined,
        }
      } as any);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (emendaData: any) => apiClient.post('/emendas', emendaData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emendas'] });
      setIsFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (emendaData: any) => apiClient.patch(`/emendas/${editingEmenda?.id}`, emendaData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emendas'] });
      setIsFormOpen(false);
      setEditingEmenda(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/emendas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emendas'] });
    },
  });

  const handleSubmit = (data: any) => {
    if (editingEmenda) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (emenda: Emenda) => {
    setEditingEmenda(emenda);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir esta emenda?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleHistory = (id: string) => {
    console.log('Ver histórico:', id);
  };

  const emendas = data?.items || [];
  const totalItems = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  const totalAmount = emendas.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emendas Parlamentares</h1>
          <p className="text-sm text-gray-500">Gestão de emendas individuais e de bancada.</p>
        </div>
        <button
          onClick={() => {
            setEditingEmenda(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-captagov-600 text-white rounded-lg hover:bg-captagov-700 transition-colors shadow-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Emenda
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Total de Emendas</p>
          <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Valor Total</p>
          <p className="text-2xl font-bold text-captagov-600">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-600">
            {emendas.filter((e: any) => e.status === 'PENDING').length}
          </p>
        </div>
      </div>

      <EmendaForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEmenda(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingEmenda ? {
          parliamentarianId: (editingEmenda as any).parliamentarianId,
          year: editingEmenda.year,
          number: editingEmenda.number,
          type: editingEmenda.type as any,
          object: editingEmenda.object,
          amount: editingEmenda.amount,
        } : undefined}
        title={editingEmenda ? 'Editar Emenda' : 'Nova Emenda'}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número ou objeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-captagov-500 outline-none text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-captagov-500 bg-white"
            >
              <option value="ALL">Todos os Anos</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </button>
          </div>
        </div>

        <EmendaTable
          emendas={emendas}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onHistory={handleHistory}
        />

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
