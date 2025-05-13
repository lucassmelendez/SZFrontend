import './globals.css';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ThemeProvider } from '@/lib/useTheme';
import { AuthProvider } from '@/lib/auth/AuthContext';
import AppProvider from './_app';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SpinZone - Tienda de Deportes',
  description: 'La mejor tienda de artículos deportivos en línea',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen flex flex-col`}>
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <Header />
              <main className="flex-grow pt-4 pb-12">{children}</main>
              <Footer />
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
