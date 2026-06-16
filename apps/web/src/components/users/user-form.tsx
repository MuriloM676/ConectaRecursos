'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';

const userSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional().or(z.literal('')),
  roleId: z.string().uuid('Selecione um perfil válido'),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  initialData?: Partial<UserFormData>;
  title: string;
}

export function UserForm({ isOpen, onClose, onSubmit, initialData, title }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <input
              {...register('name')}
              type="text"
              placeholder="Ex: João Silva"
              className={`w-full px-4 py-2 border rounded-lg outline-none transition-all text-sm ${
                errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-captagov-200 focus:border-captagov-500'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              {...register('email')}
              type="email"
              placeholder="exemplo@email.com"
              className={`w-full px-4 py-2 border rounded-lg outline-none transition-all text-sm ${
                errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-captagov-200 focus:border-captagov-500'
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className={`w-full px-4 py-2 border rounded-lg outline-none transition-all text-sm ${
                errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-captagov-200 focus:border-captagov-500'
              }`}
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso</label>
            <select
              {...register('roleId')}
              className={`w-full px-4 py-2 border rounded-lg outline-none transition-all text-sm appearance-none bg-white ${
                errors.roleId ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-captagov-200 focus:border-captagov-500'
              }`}
            >
              <option value="">Selecione um perfil...</option>
              <option value="uuid-1">Admin Municipal</option>
              <option value="uuid-2">Gestor</option>
              <option value="uuid-3">Operador</option>
              <option value="uuid-4">Visualizador</option>
            </select>
            {errors.roleId && <p className="mt-1 text-xs text-red-500">{errors.roleId.message}</p>}
          </div>

          <div className="flex space-x-3 pt-4">
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
              {isSubmitting ? 'Salvando...' : 'Salvar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
