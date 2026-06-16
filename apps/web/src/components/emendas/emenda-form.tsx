'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

const emendaSchema = z.object({
  parliamentarianId: z.string().uuid('Selecione um parlamentar'),
  year: z.number().min(2000, 'Ano inválido'),
  number: z.string().min(1, 'Número obrigatório'),
  type: z.enum(['INDIVIDUAL', 'BANCADA', 'RELATOR', 'COMISSAO']),
  object: z.string().min(10, 'Objeto deve ter no mínimo 10 caracteres'),
  amount: z.number().min(0, 'Valor deve ser positivo'),
});

type EmendaFormData = z.infer<typeof emendaSchema>;

interface EmendaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmendaFormData) => void;
  initialData?: Partial<EmendaFormData>;
  title: string;
}

export function EmendaForm({ isOpen, onClose, onSubmit, initialData, title }: EmendaFormProps) {
  const { data: parliamentariansData } = useQuery({
    queryKey: ['parliamentarians'],
    queryFn: async () => {
      const response = await apiClient.get<any[]>('/parliamentarians');
      return response.data;
    },
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmendaFormData>({
    resolver: zodResolver(emendaSchema),
    defaultValues: {
      type: 'INDIVIDUAL',
      year: new Date().getFullYear(),
      ...initialData,
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano Exercício</label>
              <input
                {...register('year', { valueAsNumber: true })}
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-captagov-500"
              />
              {errors.year && <p className="mt-1 text-xs text-red-500">{errors.year.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
              <input
                {...register('number')}
                type="text"
                placeholder="Ex: 20260001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-captagov-500"
              />
              {errors.number && <p className="mt-1 text-xs text-red-500">{errors.number.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parlamentar</label>
            <select
              {...register('parliamentarianId')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-captagov-500 bg-white"
            >
              <option value="">Selecione um parlamentar...</option>
              {parliamentariansData?.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} ({p.party}-{p.state})</option>
              ))}
            </select>
            {errors.parliamentarianId && <p className="mt-1 text-xs text-red-500">{errors.parliamentarianId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Emenda</label>
            <select
              {...register('type')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-captagov-500 bg-white"
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="BANCADA">Bancada</option>
              <option value="RELATOR">Relator</option>
              <option value="COMISSAO">Comissão</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input
              {...register('amount', { valueAsNumber: true })}
              type="number"
              step="0.01"
              placeholder="0,00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-captagov-500"
            />
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Objeto / Descrição</label>
            <textarea
              {...register('object')}
              rows={3}
              placeholder="Descreva o objetivo da emenda..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-captagov-500"
            />
            {errors.object && <p className="mt-1 text-xs text-red-500">{errors.object.message}</p>}
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-captagov-600 text-white rounded-lg hover:bg-captagov-700 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Emenda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
