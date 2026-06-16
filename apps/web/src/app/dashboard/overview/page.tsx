import React from 'react';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const stats = [
  { name: 'Total Captado', value: 'R$ 12.5M', icon: TrendingUp, change: '+12.5%', changeType: 'increase' },
  { name: 'Emendas Ativas', value: '45', icon: FileText, change: '+5', changeType: 'increase' },
  { name: 'Impedimentos', value: '3', icon: AlertTriangle, change: '-2', changeType: 'decrease' },
  { name: 'Usuários Ativos', value: '12', icon: Users, change: '0%', changeType: 'neutral' },
];

export default function DashboardOverview() {
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Emendas por Área</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            [Gráfico de Áreas - Placeholder]
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Últimas Atividades</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-captagov-500 mt-1.5" />
                <div>
                  <p className="text-gray-900 font-medium">Nova emenda sincronizada do SIOP</p>
                  <p className="text-gray-500 text-xs">Há 2 horas • Por Sistema</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
