import React from 'react';
import Link from 'next/link';
import { 
  Users, 
  LayoutDashboard, 
  FileText, 
  ShieldCheck, 
  Settings, 
  LogOut,
  Building2,
  PieChart,
  ClipboardCheck
} from 'lucide-react';

const sidebarItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Emendas', href: '/dashboard/emendas', icon: FileText },
  { name: 'Parlamentares', href: '/dashboard/parliamentarians', icon: Users },
  { name: 'Usuários', href: '/dashboard/users', icon: ShieldCheck },
  { name: 'Prestação de Contas', href: '/dashboard/prestacao-contas', icon: ClipboardCheck },
  { name: 'Tenants', href: '/dashboard/tenants', icon: Building2 },
  { name: 'Relatórios', href: '/dashboard/reports', icon: PieChart },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-captagov-600">CaptaGov</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-captagov-50 hover:text-captagov-600 transition-colors"
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-bottom border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-800">Painel de Controle</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">Usuário Admin</p>
              <p className="text-xs text-gray-500">Prefeitura de Avaré</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-captagov-100 flex items-center justify-center text-captagov-600 font-bold border border-captagov-200">
              UA
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
