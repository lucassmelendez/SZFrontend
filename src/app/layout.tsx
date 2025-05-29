import './globals.css';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ThemeProvider } from '@/lib/useTheme';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { LoginModalProvider } from '@/lib/auth/LoginModalContext';
import AppProvider from './_app';
import LoginModalWrapper from '@/components/auth/LoginModalWrapper';
import PasswordChangeModalWrapper from '@/components/auth/PasswordChangeModalWrapper';
import { Toaster } from 'react-hot-toast';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SpinZone - Tienda de Tenis de Mesa',
  description: 'Tenis de Mesa, Tenis de Mesa, Tenis de Mesa',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-800 min-h-screen flex flex-col`}>
        <ThemeProvider>
          <AuthProvider>
            <LoginModalProvider>
              <CurrencyProvider>
                <AppProvider>
                  <Header />
                  <main className="flex-grow pb-12">{children}</main>
                  <Footer />
                  <LoginModalWrapper />
                  <PasswordChangeModalWrapper />
                  <Toaster />
                </AppProvider>
              </CurrencyProvider>
            </LoginModalProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
