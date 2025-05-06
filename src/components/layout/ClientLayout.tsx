'use client';

import { ReactNode } from 'react';
import Header from "./Header";
import Footer from "./Footer";
import { ThemeProvider } from "@/lib/useTheme";
import { AuthProvider } from "@/lib/auth/AuthContext";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}