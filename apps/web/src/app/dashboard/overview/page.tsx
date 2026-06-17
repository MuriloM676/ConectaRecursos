'use client';

import React from 'react';
import {
  TrendingUp,
  Users,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626'];

const TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: 'Individual',
  BANCADA: 'Bancada',
  RELATOR: 'Relator',
  COMISSAO: 'Comissão',
};

export default function DashboardOverview() {
  const { data: overview } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/dashboard/overview');
      return res.data;
    },
    refetchInterval: 60000,
  });

  const { data: areas } = useQuery({
    queryKey: ['dashboard', 'areas'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/dashboard/areas');
      return res.data;
    },
  });

  const { data: parliamentarians } = useQuery({
    queryKey: ['dashboard', 'parliamentarians'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/dashboard/parliamentarians?limit=5');
      return res.data;
    },
  });

  const { data: financial } = useQuery({
    queryKey: ['dashboard', 'financial'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/dashboard/financial');
      return res.data;
    },
  });

  const stats = [
    {
      name: 'Total Captado',
      value: overview?.capturedAmount
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(overview.capturedAmount)
        : 'R$ 0',
      icon: TrendingUp,
      change: String(overview?.executionPercentage ?? 0) + '% executado',
      changeType: 'increase' as const,
    },
    {
      name: 'Total Recebido',
      value: overview?.receivedAmount
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(overview.receivedAmount)
        : 'R$ 0',
      icon: FileText,
      change: String(overview?.receivedPercentage ?? 0) + '% recebido',
      changeType: overview?.receivedPercentage > 50 ? 'increase' as const : 'neutral' as const,
    },
    {
      name: 'Impedimentos',
      value: String(overview?.openImpediments ?? 0),
      icon: AlertTriangle,
      change: String(overview?.activeConvenios ?? 0) + ' convênios ativos',
      changeType: overview?.openImpediments && overview.openImpediments > 0 ? 'decrease' as const : 'neutral' as const,
    },
    {
      name: 'Emendas Ativas',
      value: String(overview?.totalEmendas ?? 0),
      icon: Users,
      change: String(overview?.executionPercentage ?? 0) + '% execução',
      changeType: 'neutral' as const,
    },
  ];

  const areasData = (areas ?? []).map((a: any) => ({
    name: TYPE_LABELS[a.type] || a.type,
    value: a.totalAmount,
    count: a.count,
  }));

  const parliamentariansData = (parliamentarians ?? []).map((p: any) => ({
    name: p.name.split(' ').slice(0, 2).join(' '),
    amount: p.totalAmount,
    party: p.party,
  }));

  const monthlyData = (financial?.monthlyBreakdown ?? []).map((m: any) => ({
    name: `${String(m.month).padStart(2, '0')}/${m.year}`,
    Previsto: m.expectedAmount,
    Recebido: m.receivedAmount,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
        <p className="text-sm text-gray-500">Acompanhe o desempenho das captações de recursos do seu município.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => (
          <div key={item.name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-captagov-50 rounded-lg">
                <item.icon className="w-6 h-6 text-captagov-600" />
              </div>
              <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                item.changeType === 'increase' ? 'bg-green-100 text-green-700' :
                item.changeType === 'decrease' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {item.changeType === 'increase' && <ArrowUpRight className="w-3 h-3 mr-1" />}
                {item.changeType === 'decrease' && <ArrowDownRight className="w-3 h-3 mr-1" />}
                {item.change}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500">{item.name}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Emendas por Tipo</h3>
          {areasData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={areasData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {areasData.map((_: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Nenhum dado disponível
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cronograma Financeiro</h3>
          {monthlyData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                  />
                  <Bar dataKey="Previsto" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Recebido" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Nenhum dado financeiro disponível
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Parlamentares</h3>
          {parliamentariansData.length > 0 ? (
            <div className="space-y-4">
              {parliamentariansData.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-captagov-100 flex items-center justify-center text-xs font-bold text-captagov-600">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.party}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(p.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              Nenhum dado disponível
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Financeiro</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Previsto</p>
                <p className="text-lg font-bold text-gray-900">
                  {financial?.totalExpected
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financial.totalExpected)
                    : 'R$ 0,00'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500">Total Recebido</p>
                <p className="text-lg font-bold text-green-600">
                  {financial?.totalReceived
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financial.totalReceived)
                    : 'R$ 0,00'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-500">Saldo</p>
                <p className={`text-lg font-bold ${(financial?.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financial?.balance
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financial.balance)
                    : 'R$ 0,00'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500">Execução Física</p>
                <p className="text-lg font-bold text-captagov-600">{overview?.executionPercentage ?? 0}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
