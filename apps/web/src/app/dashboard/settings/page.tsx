'use client';

import React from 'react';
import { Settings, Shield, Bell, Database } from 'lucide-react';

const settingsSections = [
  {
    title: 'Perfil',
    description: 'Gerencie suas informações pessoais e preferências.',
    icon: Settings,
  },
  {
    title: 'Segurança',
    description: 'Configure senha e autenticação de dois fatores.',
    icon: Shield,
  },
  {
    title: 'Notificações',
    description: 'Configure alertas e notificações do sistema.',
    icon: Bell,
  },
  {
    title: 'Dados',
    description: 'Exporte ou importe dados do sistema.',
    icon: Database,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500">Gerencie as configurações do sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section) => (
          <button
            key={section.title}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-left hover:border-captagov-300 hover:shadow-md transition-all"
          >
            <div className="p-2 bg-captagov-50 rounded-lg w-fit mb-4">
              <section.icon className="w-6 h-6 text-captagov-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{section.title}</h3>
            <p className="text-sm text-gray-500">{section.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
