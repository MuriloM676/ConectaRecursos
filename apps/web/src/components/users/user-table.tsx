'use client';

import React from 'react';
import { MoreHorizontal, Edit2, Trash2, Shield } from 'lucide-react';

export interface User {
  id: string;
  name: string;
  email: string;
  roleName: string;
  active: boolean;
  createdAt: string;
}

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
}

export function UserTable({ users, isLoading, onEdit, onDelete }: UserTableProps) {
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-captagov-600"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-gray-500">
        <Shield className="w-12 h-12 mb-2 opacity-20" />
        <p>Nenhum usuário encontrado.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
          <tr>
            <th className="px-6 py-3">Nome</th>
            <th className="px-6 py-3">E-mail</th>
            <th className="px-6 py-3">Perfil</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-sm">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-captagov-100 flex items-center justify-center text-captagov-600 font-bold mr-3 text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900">{user.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-gray-600">{user.email}</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                  {user.roleName}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    user.active ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  {user.active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onEdit(user)}
                    className="p-1 text-gray-400 hover:text-captagov-600 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDelete(user.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Excluir"
                  >
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
