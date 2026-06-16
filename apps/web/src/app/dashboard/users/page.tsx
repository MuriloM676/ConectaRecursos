'use client';

import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserForm } from '@/components/users/user-form';
import { UserTable, User } from '@/components/users/user-table';
import { Pagination } from '@/components/ui/pagination';
import { apiClient } from '@/lib/api/client';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['users', { page: currentPage, search: searchTerm, status: statusFilter }],
    queryFn: async () => {
      const response = await apiClient.get<any>('/users', {
        params: {
          page: currentPage,
          limit: 20,
          search: searchTerm,
        }
      } as any);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (userData: any) => apiClient.post('/users', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (userData: any) => apiClient.patch(`/users/${editingUser?.id}`, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsFormOpen(false);
      setEditingUser(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleCreateUser = (data: any) => {
    if (editingUser) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      deleteMutation.mutate(id);
    }
  };

  const users = data?.items || [];
  const totalItems = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500">Gerencie os usuários e permissões do seu município.</p>
        </div>
        <button 
          onClick={() => {
            setEditingUser(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-captagov-600 text-white rounded-lg hover:bg-captagov-700 transition-colors shadow-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </button>
      </div>

      <UserForm 
        isOpen={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
          setEditingUser(null);
        }} 
        onSubmit={handleCreateUser}
        initialData={editingUser ? {
          name: editingUser.name,
          email: editingUser.email,
          roleId: (editingUser as any).roleId,
        } : undefined}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-captagov-500 focus:border-transparent outline-none text-sm transition-all"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-captagov-500 bg-white"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ACTIVE">Ativos</option>
              <option value="INACTIVE">Inativos</option>
            </select>
          </div>
        </div>

        <UserTable 
          users={users} 
          isLoading={isLoading} 
          onEdit={handleEditUser} 
          onDelete={handleDeleteUser} 
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
