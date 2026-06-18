'use client';

import React, { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pagination } from '@/components/ui/pagination';
import { apiClient } from '@/lib/api/client';

const REPORT_TYPES = [
  { value: 'EMENDAS', label: 'Emendas Parlamentares' },
  { value: 'CONVENIOS', label: 'Convênios' },
  { value: 'IMPEDIMENTOS', label: 'Impedimentos' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'EXECUCAO_FISICA', label: 'Execução Física' },
];

const REPORT_FORMATS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'XLSX', label: 'Excel (XLSX)' },
  { value: 'CSV', label: 'CSV' },
];

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState('EMENDAS');
  const [selectedFormat, setSelectedFormat] = useState('PDF');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['reports', { page: currentPage }],
    queryFn: async () => {
      const res = await apiClient.get<any>('/reports', {
        params: { page: currentPage, limit: 20 },
      } as any);
      return res.data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/reports/generate', null, {
        params: { type: selectedType, format: selectedFormat },
      } as any);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const handleDownload = async (id: string, fileName: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${baseUrl}/reports/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const reports = data?.items || [];
  const totalPages = data?.totalPages || 0;
  const totalItems = data?.total || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Central de Relatórios</h1>
        <p className="text-sm text-gray-500">Gere e exporte relatórios do sistema.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Gerar Novo Relatório</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Relatório</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-captagov-500 bg-white"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-captagov-500 bg-white"
            >
              {REPORT_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="inline-flex items-center px-6 py-2 bg-captagov-600 text-white rounded-lg hover:bg-captagov-700 disabled:opacity-50 transition-colors shadow-sm font-medium"
          >
            {generateMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Gerar Relatório
          </button>
        </div>
        {generateMutation.isSuccess && (
          <p className="mt-3 text-sm text-green-600">Relatório gerado com sucesso!</p>
        )}
        {generateMutation.isError && (
          <p className="mt-3 text-sm text-red-600">Erro ao gerar relatório.</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Relatórios Gerados</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Carregando...
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <FileText className="w-12 h-12 mb-3" />
            <p className="text-sm">Nenhum relatório gerado ainda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Formato</th>
                  <th className="px-6 py-3">Gerado em</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report: any) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {REPORT_TYPES.find((t) => t.value === report.reportType)?.label || report.reportType}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-captagov-100 text-captagov-800">
                        {report.format}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(report.generatedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDownload(report.id, `report_${report.reportType.toLowerCase()}.${report.format.toLowerCase()}`)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-captagov-600 hover:bg-captagov-50 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
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
