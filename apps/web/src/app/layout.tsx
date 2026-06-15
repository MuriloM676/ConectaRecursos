import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CaptaGov - Gestão de Emendas Parlamentares',
  description:
    'Plataforma SaaS Multi-Tenant para gestão de emendas parlamentares, convênios, impedimentos e prestação de contas.',
  keywords: ['emendas', 'parlamentares', 'convênios', 'prefeituras', 'gestão pública'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
