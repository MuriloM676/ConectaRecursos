'use client';

import React from 'react';
import { Edit2, Trash2, FileText, History } from 'lucide-react';

export interface Emenda {
  id: string;
  year: number;
  number: string;
  parliamentarianName: string;
  type: string;
  amount: number;
  status: string;
  object: string;
}

interface EmendaTableProps {
  emendas: Emenda[];
  isLoading: boolean;
  onEdit: (emenda: Emenda) => void;
  onDelete: (id: string) => void;
  onHistory: (id: string) => void;
}

export function EmendaTable({ emendas, isLoading, onEdit, onDelete, onHistory }: EmendaTableProps) {
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-captagov-600"></div>
      </div>
    );
  }

  if (emendas.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-gray-500">
        <FileText className="w-12 h-12 mb-2 opacity-20" />
        <p>Nenhuma emenda encontrada.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
          <tr>
            <th className="px-6 py-3 text-center">Ano</th>
            <th className="px-6 py-3">Número</th>
            <th className="px-6 py-3">Parlamentar</th>
            <th className="px-6 py-3">Valor</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-sm">
          {emendas.map((emenda) => (
            <tr key={emenda.id} className="hover:bg-gray-50 transition-colors group">
              <td className="px-6 py-4 text-center font-medium text-gray-900">{emenda.year}</td>
              <td className="px-6 py-4 text-gray-600">{emenda.number}</td>
              <td className="px-6 py-4">
                <div>
                  <div className="font-medium text-gray-900">{emenda.parliamentarianName}</div>
                  <div className="text-xs text-gray-500">{emenda.type}</div>
                </div>
              </td>
              <td className="px-6 py-4 font-semibold text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(emenda.amount)}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  emenda.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                  emenda.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {emenda.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onHistory(emenda.id)} className="p-1 text-gray-400 hover:text-blue-600" title="Histórico">
                    <History className="w-4 h-4" />
                  </button>
                  <button onClick={() => onEdit(emenda)} className="p-1 text-gray-400 hover:text-captagov-600" title="Editar">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(emenda.id)} className="p-1 text-gray-400 hover:text-red-600" title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
