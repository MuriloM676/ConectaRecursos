'use client';

import React, { useState } from 'react';
import { Plus, Search, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface Report {
  id: string;
  convenioId: string;
  convenioNumber?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  submittedAt: string | null;
  approvedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Enviado',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
};

export default function PrestacaoContasPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reportToApprove, setReportToApprove] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['accountability-reports', { page: currentPage, search: searchTerm, status: statusFilter }],
    queryFn: async () => {
      const response = await apiClient.get<any>('/accountability-reports', {
        params: {
          page: currentPage,
          limit: 20,
          search: searchTerm || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        },
      } as any);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (reportData: any) => apiClient.post('/accountability-reports', reportData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountability-reports'] });
      setIsFormOpen(false);
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/accountability-reports/${id}/submit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountability-reports'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/accountability-reports/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountability-reports'] });
      setReportToApprove(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/accountability-reports/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountability-reports'] });
    },
  });

  const reports = data?.items || [];
  const totalItems = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      convenioId: formData.get('convenioId'),
      notes: formData.get('notes'),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prestação de Contas</h1>
          <p className="text-sm text-gray-500">Gerencie relatórios de prestação de contas dos convênios.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-captagov-600 text-white rounded-lg hover:bg-captagov-700 transition-colors shadow-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Relatório
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Total</p>
          <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Rascunho</p>
          <p className="text-2xl font-bold text-gray-600">
            {reports.filter((r: Report) => r.status === 'DRAFT').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Enviados</p>
          <p className="text-2xl font-bold text-yellow-600">
            {reports.filter((r: Report) => r.status === 'SUBMITTED').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Aprovados</p>
          <p className="text-2xl font-bold text-green-600">
            {reports.filter((r: Report) => r.status === 'APPROVED').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar relatórios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-captagov-500 outline-none text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-captagov-500 bg-white"
            >
              <option value="ALL">Todos os Status</option>
              <option value="DRAFT">Rascunho</option>
              <option value="SUBMITTED">Enviado</option>
              <option value="APPROVED">Aprovado</option>
              <option value="REJECTED">Rejeitado</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum relatório encontrado</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Convênio</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Enviado em</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aprovado em</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report: Report) => (
                  <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{report.convenioNumber || report.convenioId.slice(0, 8)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[report.status]}`}>
                        {statusLabels[report.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {report.submittedAt ? new Date(report.submittedAt).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {report.approvedAt ? new Date(report.approvedAt).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {report.status === 'DRAFT' && (
                          <button
                            onClick={() => submitMutation.mutate(report.id)}
                            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                          >
                            Enviar
                          </button>
                        )}
                        {report.status === 'SUBMITTED' && (
                          <>
                            <button
                              onClick={() => setReportToApprove(report.id)}
                              className="px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(report.id)}
                              className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                            >
                              Rejeitar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {(currentPage - 1) * 20 + 1} a {Math.min(currentPage * 20, totalItems)} de {totalItems} resultados
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Novo Relatório de Prestação de Contas</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID do Convênio</label>
                <input
                  type="text"
                  name="convenioId"
                  required
                  placeholder="UUID do convênio"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-captagov-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Observações sobre o relatório"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-captagov-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-captagov-600 rounded-lg hover:bg-captagov-700"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reportToApprove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Confirmar Aprovação</h2>
            <p className="text-sm text-gray-500 mb-4">Tem certeza que deseja aprovar este relatório?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setReportToApprove(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => approveMutation.mutate(reportToApprove)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Aprovar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
